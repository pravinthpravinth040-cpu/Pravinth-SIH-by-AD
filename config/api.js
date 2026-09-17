/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Centralized API Client & Configuration Layer
 * 
 * Supports:
 * - VITE_API_URL environment variable injection
 * - Dynamic runtime configuration via UI modal (stored in localStorage)
 * - Safe production fallback with clear configuration notice
 * - Localhost used exclusively for local development
 */

(function (global) {
    'use strict';

    function isLocalEnvironment() {
        if (typeof window === 'undefined' || !window.location) return false;
        var host = window.location.hostname;
        var proto = window.location.protocol;
        return (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '0.0.0.0' ||
            proto === 'file:'
        );
    }

    function sanitizeUrl(url) {
        if (!url) return '';
        var clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
        }
        return clean;
    }

    function resolveApiBaseUrl() {
        // 1. User manual override stored in localStorage via the UI settings modal
        try {
            if (typeof localStorage !== 'undefined') {
                var stored = localStorage.getItem('sih_sar_api_url');
                if (stored && stored.trim() && !stored.includes('YOUR-DEPLOYED-BACKEND-URL')) {
                    return sanitizeUrl(stored);
                }
            }
        } catch (e) {}

        // 2. Runtime window injection from environment (e.g. VITE_API_URL or build script)
        if (typeof window !== 'undefined') {
            var envUrl = (window.__ENV__ && window.__ENV__.VITE_API_URL) || window.VITE_API_URL;
            if (envUrl && envUrl.trim() && !envUrl.includes('YOUR-DEPLOYED-BACKEND-URL')) {
                return sanitizeUrl(envUrl);
            }
        }

        // 3. If running locally, default to local backend
        if (isLocalEnvironment()) {
            return 'http://localhost:8000';
        }

        // 4. In production (GitHub Pages), empty means unconfigured
        return '';
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
         * Returns { online: boolean, configured: boolean, latencyMs: number, data: object, error: string }
         */
        checkHealth: async function (timeoutMs) {
            timeoutMs = timeoutMs || 5000;

            if (!this.isConfigured()) {
                return {
                    online: false,
                    configured: false,
                    latencyMs: 0,
                    data: null,
                    error: 'Backend URL is not configured. Please set your live backend URL in API Settings.'
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

                var data = await response.json().catch(function () { return { status: 'healthy' }; });
                return {
                    online: true,
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
                    msg = 'Backend offline or CORS blocked at ' + currentBaseUrl;
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
         * Returns parsed prediction object or throws an Error.
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
                        if (errJson.detail) errDetail = errJson.detail;
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
