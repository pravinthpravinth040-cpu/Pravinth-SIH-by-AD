/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Centralized API Client & Configuration Layer
 * 
 * Complies with GitHub Pages deployment requirements:
 * - Dynamic resolution hierarchy (localStorage -> window.VITE_API_URL -> Production placeholder -> Localhost)
 * - Zero external build dependencies (runs natively in all modern browsers)
 * - Localhost is NEVER used in production on *.github.io unless explicitly saved by user
 * - Probes GET /health dynamically for live connectivity
 * - Handles real AI inference and network timeouts gracefully
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
                if (stored && stored.trim()) {
                    return sanitizeUrl(stored);
                }
            }
        } catch (e) {}

        // 2. Runtime window injection from environment
        if (typeof window !== 'undefined') {
            if (window.__ENV__ && window.__ENV__.VITE_API_URL) {
                return sanitizeUrl(window.__ENV__.VITE_API_URL);
            }
            if (window.VITE_API_URL) {
                return sanitizeUrl(window.VITE_API_URL);
            }
        }

        // 3. If running locally, default to local backend
        if (isLocalEnvironment()) {
            return 'http://localhost:8000';
        }

        // 4. If deployed on GitHub Pages or other public web host, use production placeholder
        return 'https://YOUR-BACKEND-DOMAIN';
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
         * Checks if the active URL is still pointing to unconfigured placeholder
         */
        isPlaceholderUrl: function () {
            return !currentBaseUrl || currentBaseUrl.indexOf('YOUR-BACKEND-DOMAIN') !== -1 || currentBaseUrl.indexOf('example.com') !== -1;
        },

        /**
         * Health Check: GET /health
         * Returns { online: boolean, latencyMs: number, data: object, error: string }
         */
        checkHealth: async function (timeoutMs) {
            timeoutMs = timeoutMs || 5000;
            if (this.isPlaceholderUrl()) {
                return {
                    online: false,
                    latencyMs: 0,
                    error: 'Cloud backend not configured. Please set your live backend URL in API Settings.'
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
            if (this.isPlaceholderUrl()) {
                throw new Error('Backend URL is not configured. Please click "API Settings" and enter your deployed backend URL.');
            }

            var formData = new FormData();
            formData.append('file', fileBlob, filename);

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
            var res = await fetch(currentBaseUrl + '/samples/' + filename, { mode: 'cors' });
            if (!res.ok) throw new Error('Could not fetch sample ' + filename);
            return await res.blob();
        }
    };

    // Attach to global scope
    global.SentinelAPI = SentinelAPI;
    global.API_BASE_URL = currentBaseUrl;
})(typeof window !== 'undefined' ? window : this);
