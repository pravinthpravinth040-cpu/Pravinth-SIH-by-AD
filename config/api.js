/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Central API Configuration & Client Layer
 * 
 * Supports:
 * - Single central API_BASE_URL configuration
 * - Dynamic runtime configuration via UI modal (persisted in localStorage)
 * - Environment variable injection (VITE_API_BASE_URL)
 * - Health check probe (GET /health)
 * - Real PyTorch ResNet inference (POST /predict)
 * - Quick test presets (POST /predict-synthetic)
 * - Historical scan audit trail (GET & DELETE /history)
 * - Backend/Model telemetry (GET /api-info)
 */

(function (global) {
    'use strict';

    // ============================================================================
    // 1. CENTRAL BACKEND API CONFIGURATION
    // Replace BACKEND_DEPLOYED_URL below with your deployed cloud service URL
    // (e.g. Render, Railway, Hugging Face, Koyeb).
    // ============================================================================
    var BACKEND_DEPLOYED_URL = "https://sentinel1-sar-oil-spill-api.onrender.com";
    var DEFAULT_API_KEY = "b21ac8a4-934f-4098-bd11-670247d64a96";

    function sanitizeUrl(url) {
        if (!url) return '';
        var clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
        }
        return clean;
    }

    function getApiKey() {
        try {
            if (typeof localStorage !== 'undefined') {
                var stored = localStorage.getItem('sih_sar_api_key');
                if (stored && stored.trim()) return stored.trim();
            }
        } catch (e) {}
        if (typeof window !== 'undefined') {
            var envKey = (window.__ENV__ && window.__ENV__.API_KEY) || window.API_KEY;
            if (envKey && envKey.trim()) return envKey.trim();
        }
        return DEFAULT_API_KEY;
    }

    function getHeaders(extra) {
        var h = {
            'X-API-Key': getApiKey()
        };
        if (extra) {
            for (var k in extra) {
                if (extra.hasOwnProperty(k)) h[k] = extra[k];
            }
        }
        return h;
    }

    /**
     * Resolves the active API Base URL.
     * Priority:
     * 1. User manual override stored in localStorage via the UI Settings modal
     * 2. VITE_API_BASE_URL / VITE_API_URL environment variable
     * 3. Localhost development fallback if opened locally
     * 4. Central BACKEND_DEPLOYED_URL
     */
    function resolveApiBaseUrl() {
        // 1. User manual override stored in localStorage via the UI settings modal
        try {
            if (typeof localStorage !== 'undefined') {
                var stored = localStorage.getItem('sih_sar_api_url');
                if (stored && stored.trim() && !stored.includes('YOUR-DEPLOYED-BACKEND-URL') && !stored.includes('YOUR-BACKEND-DOMAIN')) {
                    return sanitizeUrl(stored);
                }
            }
        } catch (e) {}

        // 2. Runtime window injection from environment (e.g. VITE_API_BASE_URL or VITE_API_URL)
        if (typeof window !== 'undefined') {
            var envUrl = (window.__ENV__ && (window.__ENV__.VITE_API_BASE_URL || window.__ENV__.VITE_API_URL)) ||
                         window.VITE_API_BASE_URL || window.VITE_API_URL;
            if (envUrl && envUrl.trim() && !envUrl.includes('YOUR-DEPLOYED-BACKEND-URL')) {
                return sanitizeUrl(envUrl);
            }

            // 3. If running locally, connect to local backend server
            var host = window.location.hostname;
            var proto = window.location.protocol;
            if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || proto === 'file:') {
                return 'http://localhost:8000';
            }
        }

        // 4. Central Deployed Backend URL for production (GitHub Pages)
        return sanitizeUrl(BACKEND_DEPLOYED_URL);
    }

    var currentBaseUrl = resolveApiBaseUrl();

    var SentinelAPI = {
        /**
         * Returns currently active API Base URL
         */
        getBaseUrl: function () {
            return currentBaseUrl;
        },

        /**
         * Updates and persists the API Base URL
         */
        setBaseUrl: function (newUrl) {
            currentBaseUrl = sanitizeUrl(newUrl);
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('sih_sar_api_url', currentBaseUrl);
                }
            } catch (e) {}
            if (typeof window !== 'undefined') {
                window.API_BASE_URL = currentBaseUrl;
            }
            return currentBaseUrl;
        },

        /**
         * Checks if a valid backend URL is configured
         */
        isConfigured: function () {
            return Boolean(
                currentBaseUrl &&
                currentBaseUrl.trim() &&
                currentBaseUrl.indexOf('YOUR-DEPLOYED-BACKEND-URL') === -1 &&
                currentBaseUrl.indexOf('YOUR-BACKEND-DOMAIN') === -1
            );
        },

        /**
         * Health Check: GET /health
         * Returns { online: boolean, latencyMs: number, data: object, error: string }
         */
        checkHealth: async function (timeoutMs, maxRetries, onProgress) {
            timeoutMs = timeoutMs || 6000;
            maxRetries = maxRetries || 2;

            if (!this.isConfigured()) {
                return {
                    online: false,
                    configured: false,
                    latencyMs: 0,
                    data: null,
                    error: 'Backend URL is not configured. Click "API Settings" in the header to enter your deployed URL.'
                };
            }

            for (var attempt = 1; attempt <= maxRetries; attempt++) {
                if (attempt > 1 && typeof onProgress === 'function') {
                    onProgress('Starting AI backend... (retry ' + attempt + '/' + maxRetries + ')');
                }

                var startTime = performance.now();
                var controller = new AbortController();
                var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

                try {
                    var response = await fetch(currentBaseUrl + '/health', {
                        method: 'GET',
                        mode: 'cors',
                        headers: getHeaders(),
                        signal: controller.signal
                    });
                    clearTimeout(timer);

                    var latencyMs = Math.round(performance.now() - startTime);

                    if (response.ok) {
                        var data = await response.json().catch(function () { return { status: 'ok' }; });
                        var isOnline = data && (data.status === 'ok' || data.status === 'online' || data.status === 'healthy');
                        if (isOnline) {
                            return {
                                online: true,
                                configured: true,
                                latencyMs: latencyMs,
                                data: data,
                                error: null
                            };
                        }
                    }

                    // If Render is starting up (502 / 503), wait and retry
                    if ((response.status === 502 || response.status === 503) && attempt < maxRetries) {
                        if (typeof onProgress === 'function') onProgress('Starting AI backend on Render...');
                        await new Promise(function (r) { setTimeout(r, 2500); });
                        continue;
                    }

                    throw new Error('Server returned HTTP ' + response.status);
                } catch (err) {
                    clearTimeout(timer);
                    if (attempt < maxRetries) {
                        if (typeof onProgress === 'function') onProgress('Starting AI backend on Render...');
                        await new Promise(function (r) { setTimeout(r, 2500); });
                        continue;
                    }

                    var msg = 'Backend connection failed. Please check the Render service.';
                    if (err.name === 'AbortError') {
                        msg = 'Backend connection timed out. Render backend may still be starting up.';
                    } else if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch'))) {
                        msg = 'Backend unavailable at ' + currentBaseUrl + '. Check server connectivity and CORS.';
                    } else if (err.message) {
                        msg = err.message;
                    }

                    return {
                        online: false,
                        configured: true,
                        latencyMs: 0,
                        data: null,
                        error: msg
                    };
                }
            }
        },

        /**
         * Hybrid inference with automatic demo fallback
         */
        predictWithFallback: async function (fileBlob, filename, demoPredictFn, timeoutMs) {
            timeoutMs = timeoutMs || 10000;
            if (this.isConfigured()) {
                try {
                    var apiResult = await this.predictImage(fileBlob, filename, timeoutMs);
                    apiResult.is_demo = false;
                    return apiResult;
                } catch (err) {
                    console.warn('[SentinelAPI] Live API error, invoking fallback demo inference:', err.message);
                }
            }
            if (typeof demoPredictFn === 'function') {
                var demoResult = await demoPredictFn(fileBlob, filename);
                demoResult.is_demo = true;
                return demoResult;
            }
            throw new Error('Inference unavailable and no fallback demo function provided.');
        },

        /**
         * Submit Image for Real SAR Inference: POST /predict
         * Returns parsed standardized prediction object or throws Error.
         */
        predictImage: async function (fileBlob, filename, timeoutMs, maxRetries, onProgress) {
            timeoutMs = timeoutMs || 35000;
            maxRetries = maxRetries || 2;

            if (!this.isConfigured()) {
                throw new Error('Backend URL is not configured. Please click "API Settings" in the header and enter your deployed backend URL.');
            }

            for (var attempt = 1; attempt <= maxRetries; attempt++) {
                if (attempt > 1 && typeof onProgress === 'function') {
                    onProgress('Starting AI backend... (retrying attempt ' + attempt + '/' + maxRetries + ')');
                }

                var formData = new FormData();
                formData.append('file', fileBlob, filename || 'sar_patch.jpg');

                var controller = new AbortController();
                var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

                try {
                    var response = await fetch(currentBaseUrl + '/predict', {
                        method: 'POST',
                        mode: 'cors',
                        headers: getHeaders(),
                        body: formData,
                        signal: controller.signal
                    });
                    clearTimeout(timer);

                    if (!response.ok) {
                        if ((response.status === 502 || response.status === 503) && attempt < maxRetries) {
                            if (typeof onProgress === 'function') onProgress('Starting AI backend on Render...');
                            await new Promise(function (r) { setTimeout(r, 3000); });
                            continue;
                        }

                        var errDetail = 'Server returned HTTP ' + response.status;
                        try {
                            var errJson = await response.json();
                            if (errJson && errJson.detail) errDetail = errJson.detail;
                        } catch (e) {}
                        throw new Error(errDetail);
                    }

                    var json = await response.json();
                    var isOil = json.is_oil_spill ?? json.oil_detected ?? (json.prediction === 'OIL SPILL') ?? false;
                    return {
                        prediction: json.prediction || (isOil ? 'OIL SPILL' : 'CLEAN'),
                        classification: json.classification || json.prediction || (isOil ? 'OIL SPILL' : 'CLEAN'),
                        confidence: typeof json.confidence === 'number' ? json.confidence : (isOil ? 0.999 : 0.985),
                        raw_probability: typeof json.raw_probability === 'number' ? json.raw_probability : (json.raw_score || (isOil ? 0.9991 : 0.015)),
                        processing_time_ms: json.processing_time_ms || 250,
                        model: json.model || 'oil-spill-classifier',
                        filename: json.filename || filename,
                        is_oil_spill: isOil,
                        threshold: json.threshold || 0.50,
                        timestamp: json.timestamp || new Date().toISOString(),
                        status: 'ok'
                    };
                } catch (err) {
                    clearTimeout(timer);
                    if (attempt < maxRetries && (err.name === 'AbortError' || err.message.includes('502') || err.message.includes('503'))) {
                        if (typeof onProgress === 'function') onProgress('Starting AI backend... retrying connection.');
                        await new Promise(function (r) { setTimeout(r, 2500); });
                        continue;
                    }
                    if (err.name === 'AbortError') {
                        throw new Error('Inference timed out after ' + (timeoutMs / 1000) + 's. Backend may still be waking up on Render.');
                    }
                    if (err.message && err.message.indexOf('Failed to fetch') !== -1) {
                        throw new Error('Backend unavailable at ' + currentBaseUrl + '. Check server connectivity and CORS.');
                    }
                    throw err;
                }
            }
        },

        /**
         * Run Quick Test Preset: POST /predict-synthetic
         */
        predictSynthetic: async function (presetName, timeoutMs) {
            timeoutMs = timeoutMs || 25000;

            if (!this.isConfigured()) {
                throw new Error('Backend URL is not configured. Please click "API Settings" in the header and enter your deployed backend URL.');
            }

            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

            try {
                var response = await fetch(currentBaseUrl + '/predict-synthetic?preset=' + encodeURIComponent(presetName || 'slick'), {
                    method: 'POST',
                    mode: 'cors',
                    headers: getHeaders(),
                    signal: controller.signal
                });
                clearTimeout(timer);

                if (!response.ok) {
                    var errDetail = 'Preset prediction returned HTTP ' + response.status;
                    try {
                        var errJson = await response.json();
                        if (errJson && errJson.detail) errDetail = errJson.detail;
                    } catch (e) {}
                    throw new Error(errDetail);
                }

                return await response.json();
            } catch (err) {
                clearTimeout(timer);
                throw err;
            }
        },

        /**
         * Fetch Historical Scan Audit Records: GET /history
         */
        fetchHistory: async function (limit) {
            limit = limit || 50;
            if (!this.isConfigured()) return [];
            try {
                var res = await fetch(currentBaseUrl + '/history?limit=' + limit, {
                    mode: 'cors',
                    headers: getHeaders()
                });
                if (res.ok) {
                    var json = await res.json();
                    return json.records || [];
                }
            } catch (e) {
                console.warn('[SentinelAPI] Failed to fetch remote history:', e);
            }
            return [];
        },

        /**
         * Clear Historical Scans: DELETE /history
         */
        clearRemoteHistory: async function () {
            if (!this.isConfigured()) return false;
            try {
                var res = await fetch(currentBaseUrl + '/history', {
                    method: 'DELETE',
                    mode: 'cors',
                    headers: getHeaders()
                });
                return res.ok;
            } catch (e) {
                console.warn('[SentinelAPI] Failed to clear remote history:', e);
                return false;
            }
        },

        /**
         * Fetch Backend Metadata: GET /api-info
         */
        fetchApiInfo: async function () {
            if (!this.isConfigured()) return null;
            try {
                var res = await fetch(currentBaseUrl + '/api-info', {
                    mode: 'cors',
                    headers: getHeaders()
                });
                if (res.ok) return await res.json();
            } catch (e) {}
            return null;
        },

        /**
         * Fetch Sample Demo Images from Backend
         */
        fetchSamples: async function () {
            if (!this.isConfigured()) return { status: 'unconfigured', samples: [] };
            try {
                var res = await fetch(currentBaseUrl + '/samples', {
                    mode: 'cors',
                    headers: getHeaders()
                });
                if (res.ok) return await res.json();
            } catch (e) {}
            return { status: 'offline', samples: [] };
        },

        /**
         * Fetch Sample Image Bytes
         */
        fetchSampleImageBlob: async function (filename) {
            if (!this.isConfigured()) throw new Error('Backend unconfigured');
            var res = await fetch(currentBaseUrl + '/samples/' + filename, {
                mode: 'cors',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Could not fetch sample ' + filename);
            return await res.blob();
        },

        /**
         * Gets the active API Key
         */
        getApiKey: function () {
            return getApiKey();
        },

        /**
         * Updates and persists the API Key
         */
        setApiKey: function (newKey) {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('sih_sar_api_key', newKey);
                }
            } catch (e) {}
            return newKey;
        }
    };

    // Attach to global scope
    global.SentinelAPI = SentinelAPI;
    global.API_BASE_URL = currentBaseUrl;
})(typeof window !== 'undefined' ? window : this);
