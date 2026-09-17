/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Centralized API Client & Configuration Layer
 * 
 * Complies with GitHub Pages deployment requirements:
 * - Dynamic resolution hierarchy (localStorage -> VITE_API_URL -> Production placeholder -> Localhost)
 * - Localhost is NEVER used in production on *.github.io unless explicitly saved by user
 * - Probes GET /health dynamically for live connectivity
 * - Handles real AI inference and network timeouts gracefully
 */

(function (global) {
    'use strict';

    // Check if running on local development machine
    function isLocalEnvironment() {
        if (typeof window === 'undefined' || !window.location) return false;
        const host = window.location.hostname;
        const proto = window.location.protocol;
        return (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '0.0.0.0' ||
            proto === 'file:'
        );
    }

    // Resolve the appropriate API Base URL
    function resolveApiBaseUrl() {
        // 1. User manual override stored in localStorage via the UI settings modal
        const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('sih_sar_api_url') : null;
        if (stored && stored.trim()) {
            return sanitizeUrl(stored.trim());
        }

        // 2. Vite / Bundler environment variable if built
        try {
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
                return sanitizeUrl(import.meta.env.VITE_API_URL);
            }
        } catch (e) {
            // import.meta may not be supported in non-module scripts
        }

        // 3. Runtime window injection
        if (typeof window !== 'undefined') {
            if (window.__ENV__ && window.__ENV__.VITE_API_URL) {
                return sanitizeUrl(window.__ENV__.VITE_API_URL);
            }
            if (window.VITE_API_URL) {
                return sanitizeUrl(window.VITE_API_URL);
            }
        }

        // 4. If running locally, default to local backend
        if (isLocalEnvironment()) {
            return 'http://localhost:8000';
        }

        // 5. If deployed on GitHub Pages or other public web host, use production placeholder
        // Users must configure their live cloud backend in the Settings modal or .env.production
        return 'https://YOUR-BACKEND-DOMAIN';
    }

    function sanitizeUrl(url) {
        if (!url) return '';
        let clean = url.replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
        }
        return clean;
    }

    let currentBaseUrl = resolveApiBaseUrl();

    const SentinelAPI = {
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
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sih_sar_api_url', currentBaseUrl);
            }
            return currentBaseUrl;
        },

        /**
         * Checks if the active URL is still pointing to unconfigured placeholder
         */
        isPlaceholderUrl: function () {
            return currentBaseUrl.includes('YOUR-BACKEND-DOMAIN') || currentBaseUrl.includes('example.com');
        },

        /**
         * Health Check: GET /health
         * Returns { online: boolean, latencyMs: number, data: object, error: string }
         */
        checkHealth: async function (timeoutMs = 6000) {
            if (this.isPlaceholderUrl()) {
                return {
                    online: false,
                    latencyMs: 0,
                    error: 'Cloud backend not configured. Please set your live backend URL in API Settings.'
                };
            }

            const startTime = performance.now();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(`${currentBaseUrl}/health`, {
                    method: 'GET',
                    mode: 'cors',
                    signal: controller.signal
                });
                clearTimeout(timer);

                const latencyMs = Math.round(performance.now() - startTime);

                if (!response.ok) {
                    throw new Error(`Server returned HTTP ${response.status}`);
                }

                const data = await response.json().catch(() => ({ status: 'healthy' }));
                return {
                    online: true,
                    latencyMs: latencyMs,
                    data: data,
                    error: null
                };
            } catch (err) {
                clearTimeout(timer);
                let msg = err.message;
                if (err.name === 'AbortError') {
                    msg = `Connection timed out after ${timeoutMs}ms`;
                } else if (err.message && err.message.includes('Failed to fetch')) {
                    msg = 'Network error or CORS blocked. Ensure backend is running and allows this origin.';
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
        predictImage: async function (fileBlob, filename, timeoutMs = 30000) {
            if (this.isPlaceholderUrl()) {
                throw new Error('Backend URL is not configured. Please click "API Settings" and enter your deployed backend URL.');
            }

            const formData = new FormData();
            formData.append('file', fileBlob, filename);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(`${currentBaseUrl}/predict`, {
                    method: 'POST',
                    mode: 'cors',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timer);

                if (!response.ok) {
                    let errDetail = `Server returned HTTP ${response.status}`;
                    try {
                        const errJson = await response.json();
                        if (errJson.detail) errDetail = errJson.detail;
                    } catch (e) {
                        // ignore json parse error
                    }
                    throw new Error(errDetail);
                }

                const json = await response.json();
                return json;
            } catch (err) {
                clearTimeout(timer);
                if (err.name === 'AbortError') {
                    throw new Error(`Inference timed out after ${timeoutMs / 1000}s. Server took too long to process SAR patch.`);
                }
                if (err.message && err.message.includes('Failed to fetch')) {
                    throw new Error(`Backend unavailable at ${currentBaseUrl}. Check network connectivity and CORS settings.`);
                }
                throw err;
            }
        },

        /**
         * Fetch Sample Demo Images from Backend
         */
        fetchSamples: async function () {
            try {
                const res = await fetch(`${currentBaseUrl}/samples`, { mode: 'cors' });
                if (res.ok) return await res.json();
            } catch (e) {
                // Return empty if offline
            }
            return { status: 'offline', samples: [] };
        },

        /**
         * Fetch Sample Image Bytes
         */
        fetchSampleImageBlob: async function (filename) {
            const res = await fetch(`${currentBaseUrl}/samples/${filename}`, { mode: 'cors' });
            if (!res.ok) throw new Error(`Could not fetch sample ${filename}`);
            return await res.blob();
        },

        /**
         * Fetch Audit History from Backend Database
         */
        fetchHistory: async function (limit = 50) {
            try {
                const res = await fetch(`${currentBaseUrl}/history?limit=${limit}`, { mode: 'cors' });
                if (res.ok) return await res.json();
            } catch (e) {
                // ignore
            }
            return { status: 'offline', records: [] };
        }
    };

    // Attach to global window
    global.SentinelAPI = SentinelAPI;
    global.API_BASE_URL = currentBaseUrl;

    // Support ES module exports if environment supports it
    if (typeof exports !== 'undefined') {
        exports.SentinelAPI = SentinelAPI;
        exports.API_BASE_URL = currentBaseUrl;
    }
})(typeof window !== 'undefined' ? window : globalThis);
