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

    function sanitizeUrl(url) {
        if (!url) return '';
        var clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
        }
        return clean;
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
        checkHealth: async function (timeoutMs) {
            timeoutMs = timeoutMs || 6000;

            if (!this.isConfigured()) {
                return {
                    online: false,
                    configured: false,
                    latencyMs: 0,
                    data: null,
                    error: 'Backend URL is not configured. Click "API Settings" in the header to enter your deployed URL.'
                };
            }

            var startTime = performance.now();
            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

            try {
                var response = await fetch(currentBaseUrl + '/health', {
                    method: 'GET',
                    mode: 'cors',
                    signal: controller.signal
                });
                clearTimeout(timer);

                var latencyMs = Math.round(performance.now() - startTime);

                if (!response.ok) {
                    throw new Error('Server returned HTTP ' + response.status);
                }

                var data = await response.json().catch(function () { return { status: 'online' }; });
                var isOnline = data && (data.status === 'online' || data.status === 'healthy' || data.status === 'ok');

                return {
                    online: Boolean(isOnline),
                    configured: true,
                    latencyMs: latencyMs,
                    data: data,
                    error: null
                };
            } catch (err) {
                clearTimeout(timer);
                var msg = err.message || 'Connection failed';
                if (err.name === 'AbortError') {
                    msg = 'Connection timed out after ' + timeoutMs + 'ms';
                } else if (msg.indexOf('Failed to fetch') !== -1) {
                    msg = 'Backend unreachable or CORS blocked at ' + currentBaseUrl;
                }
                return {
                    online: false,
                    configured: true,
                    latencyMs: 0,
                    data: null,
                    error: msg
                };
            }
        },

        /**
         * Submit Image for Real SAR Inference: POST /predict
         * Returns parsed standardized prediction object or throws Error.
         */
        predictImage: async function (fileBlob, filename, timeoutMs) {
            timeoutMs = timeoutMs || 30000;

            if (!this.isConfigured()) {
                throw new Error('Backend URL is not configured. Please click "API Settings" in the header and enter your deployed backend URL.');
            }

            var formData = new FormData();
            formData.append('file', fileBlob, filename || 'sar_patch.jpg');

            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

            try {
                var response = await fetch(currentBaseUrl + '/predict', {
                    method: 'POST',
                    mode: 'cors',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timer);

                if (!response.ok) {
                    var errDetail = 'Server returned HTTP ' + response.status;
                    try {
                        var errJson = await response.json();
                        if (errJson && errJson.detail) errDetail = errJson.detail;
                    } catch (e) {}
                    throw new Error(errDetail);
                }

                var json = await response.json();
                return json;
            } catch (err) {
                clearTimeout(timer);
                if (err.name === 'AbortError') {
                    throw new Error('Inference timed out after ' + (timeoutMs / 1000) + 's.');
                }
                if (err.message && err.message.indexOf('Failed to fetch') !== -1) {
                    throw new Error('Backend unavailable at ' + currentBaseUrl + '. Check server connectivity and CORS.');
                }
                throw err;
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
                var res = await fetch(currentBaseUrl + '/history?limit=' + limit, { mode: 'cors' });
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
                var res = await fetch(currentBaseUrl + '/history', { method: 'DELETE', mode: 'cors' });
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
                var res = await fetch(currentBaseUrl + '/api-info', { mode: 'cors' });
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
                var res = await fetch(currentBaseUrl + '/samples', { mode: 'cors' });
                if (res.ok) return await res.json();
            } catch (e) {}
            return { status: 'offline', samples: [] };
        },

        /**
         * Fetch Sample Image Bytes
         */
        fetchSampleImageBlob: async function (filename) {
            if (!this.isConfigured()) throw new Error('Backend unconfigured');
            var res = await fetch(currentBaseUrl + '/samples/' + filename, { mode: 'cors' });
            if (!res.ok) throw new Error('Could not fetch sample ' + filename);
            return await res.blob();
        }
    };

    // Attach to global scope
    global.SentinelAPI = SentinelAPI;
    global.API_BASE_URL = currentBaseUrl;
})(typeof window !== 'undefined' ? window : this);
