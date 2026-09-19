/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Production API Configuration & Client Layer
 * 
 * Supports:
 * - Production cloud deployment on Render
 * - Intelligent local development auto-detection (localhost:8000)
 * - Dynamic runtime configuration via UI modal (persisted in localStorage)
 * - Resilient connection probing
 */

(function (global) {
    'use strict';

    var DEFAULT_DEPLOYED_URL = "https://sentinel1-sar-oil-spill-api.onrender.com";
    var LOCAL_URL = "http://localhost:8000";

    function sanitizeUrl(url) {
        if (!url) return '';
        var clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
        }
        return clean;
    }

    function isLocalEnvironment() {
        if (typeof window === 'undefined') return false;
        var host = window.location.hostname;
        var proto = window.location.protocol;
        return (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || proto === 'file:');
    }

    function resolveApiBaseUrl() {
        // 1. User manual override stored in localStorage via the UI settings modal
        try {
            if (typeof localStorage !== 'undefined') {
                var stored = localStorage.getItem('sih_sar_api_url');
                if (stored && stored.trim() && !stored.includes('YOUR-BACKEND-NAME')) {
                    return sanitizeUrl(stored);
                }
            }
        } catch (e) {}

        // 2. Global window configuration (window.API_BASE_URL or window.__ENV__)
        if (typeof window !== 'undefined') {
            var winUrl = window.API_BASE_URL ||
                         (window.__ENV__ && (window.__ENV__.API_BASE_URL || window.__ENV__.VITE_API_BASE_URL)) ||
                         window.VITE_API_BASE_URL;
            if (winUrl && winUrl.trim() && !winUrl.includes('YOUR-BACKEND-NAME')) {
                return sanitizeUrl(winUrl);
            }

            // If user is running/testing locally on their machine (file:// or localhost)
            if (isLocalEnvironment()) {
                return LOCAL_URL;
            }
        }

        // 3. Central Production Cloud Backend URL (Render)
        return sanitizeUrl(DEFAULT_DEPLOYED_URL);
    }

    var API_BASE_URL = resolveApiBaseUrl();

    function setBaseUrl(newUrl) {
        if (!newUrl || !newUrl.trim()) return;
        var sanitized = sanitizeUrl(newUrl);
        API_BASE_URL = sanitized;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sih_sar_api_url', sanitized);
            }
            if (typeof window !== 'undefined') {
                window.API_BASE_URL = sanitized;
            }
        } catch (e) {}
    }

    function getBaseUrl() {
        return API_BASE_URL;
    }

    // ============================================================================
    // HTTP UTILITIES WITH AUTOMATIC RETRY & TIMEOUT
    // ============================================================================
    async function requestJson(endpoint, options, timeoutMs, maxRetries) {
        var base = getBaseUrl();
        var url = endpoint.startsWith('http') ? endpoint : (base + endpoint);
        var timeout = timeoutMs || 12000;
        var retries = typeof maxRetries === 'number' ? maxRetries : 1;
        var lastError = null;

        for (var attempt = 0; attempt <= retries; attempt++) {
            var controller = new AbortController();
            var timerId = setTimeout(function () {
                controller.abort();
            }, timeout);

            try {
                var fetchOpts = Object.assign({}, options || {}, {
                    signal: controller.signal
                });

                var res = await fetch(url, fetchOpts);
                clearTimeout(timerId);

                if (!res.ok) {
                    var errorMsg = "HTTP error " + res.status;
                    try {
                        var errJson = await res.json();
                        if (errJson && errJson.detail) errorMsg = errJson.detail;
                    } catch (_) {}
                    throw new Error(errorMsg);
                }

                return await res.json();
            } catch (err) {
                clearTimeout(timerId);
                lastError = err;
                if (err.name === 'AbortError') {
                    lastError = new Error("Request to " + endpoint + " timed out after " + (timeout / 1000) + "s.");
                }
                if (attempt < retries) {
                    await new Promise(function (r) { setTimeout(r, 500 * (attempt + 1)); });
                }
            }
        }

        throw lastError;
    }

    // ============================================================================
    // CENTRAL CLIENT API OBJECT
    // ============================================================================
    var SentinelAPI = {
        getBaseUrl: getBaseUrl,
        setBaseUrl: setBaseUrl,
        isConfigured: function () {
            var base = getBaseUrl();
            return !!(base && base.length > 5);
        },

        // Health & Diagnostics with auto-failover
        checkHealth: async function (timeoutMs) {
            var t0 = Date.now();
            var primaryUrl = getBaseUrl();

            try {
                var data = await requestJson('/api/health', { method: 'GET' }, timeoutMs || 5000, 0);
                var isOnline = (data && (data.status === 'online' || data.status === 'ok' || data.online === true));
                return {
                    online: isOnline,
                    status: (data && data.status) || 'online',
                    service: data && data.service,
                    data_sources: data && data.data_sources,
                    endpoint: primaryUrl,
                    latencyMs: Date.now() - t0,
                    raw: data
                };
            } catch (err) {
                // If primary failed and primary was the cloud URL, probe local backend
                if (primaryUrl !== LOCAL_URL) {
                    try {
                        var localRes = await fetch(LOCAL_URL + '/api/health', { method: 'GET', signal: AbortSignal.timeout(2500) });
                        if (localRes.ok) {
                            var localData = await localRes.json();
                            setBaseUrl(LOCAL_URL);
                            return {
                                online: true,
                                status: 'online',
                                service: localData.service,
                                data_sources: localData.data_sources,
                                endpoint: LOCAL_URL,
                                latencyMs: Date.now() - t0,
                                raw: localData
                            };
                        }
                    } catch (_) {}
                }

                return {
                    online: false,
                    status: 'offline',
                    error: err.message,
                    endpoint: primaryUrl,
                    latencyMs: Date.now() - t0
                };
            }
        },

        checkLegacyHealth: async function (timeoutMs) {
            return await requestJson('/health', { method: 'GET' }, timeoutMs || 5000, 0);
        },

        fetchApiInfo: async function () {
            return await requestJson('/api-info', { method: 'GET' });
        },

        // Dashboard Summary
        fetchDashboardSummary: async function () {
            return await requestJson('/api/dashboard/summary', { method: 'GET' }, 8000, 1);
        },

        // AIS Vessel Data
        fetchLiveAIS: async function (vesselType, search, limit) {
            var params = new URLSearchParams();
            if (vesselType && vesselType !== 'All') params.append('vessel_type', vesselType);
            if (search) params.append('search', search);
            if (limit) params.append('limit', limit);
            var query = params.toString() ? ('?' + params.toString()) : '';
            return await requestJson('/api/ais/live' + query, { method: 'GET' });
        },
        fetchAISHistorical: async function (mmsi, limit) {
            var params = new URLSearchParams();
            if (mmsi) params.append('mmsi', mmsi);
            if (limit) params.append('limit', limit || 200);
            return await requestJson('/api/ais/history?' + params.toString(), { method: 'GET' });
        },
        fetchVesselDetails: async function (mmsi) {
            return await requestJson('/api/ais/vessel/' + encodeURIComponent(mmsi), { method: 'GET' });
        },

        // Satellite Observations
        fetchSatelliteLatest: async function (limit) {
            return await requestJson('/api/satellite/latest?limit=' + (limit || 10), { method: 'GET' });
        },
        fetchSatelliteHistory: async function (dateFrom, dateTo, limit) {
            var params = new URLSearchParams();
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (limit) params.append('limit', limit || 50);
            var query = params.toString() ? ('?' + params.toString()) : '';
            return await requestJson('/api/satellite/history' + query, { method: 'GET' });
        },

        // Oil Spills & Detection
        fetchOilSpills: async function (status, limit) {
            var params = new URLSearchParams();
            if (status && status !== 'All') params.append('status', status);
            if (limit) params.append('limit', limit || 50);
            var query = params.toString() ? ('?' + params.toString()) : '';
            return await requestJson('/api/oil-spills' + query, { method: 'GET' });
        },
        fetchOilSpillDetails: async function (spillId) {
            return await requestJson('/api/oil-spills/' + encodeURIComponent(spillId), { method: 'GET' });
        },
        detectOilSpill: async function (imageBlob, filename, lat, lon) {
            var formData = new FormData();
            formData.append('file', imageBlob, filename || 'sar_tile.jpg');
            if (lat) formData.append('latitude', lat);
            if (lon) formData.append('longitude', lon);

            var base = getBaseUrl();
            var res = await fetch(base + '/api/oil-spills/detect', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Spill detection failed: ' + res.statusText);
            return await res.json();
        },
        analyzeOilSpill: async function (spillId) {
            return await requestJson('/api/oil-spills/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spill_id: spillId })
            });
        },

        // Vessel Correlation & Nearby
        fetchNearbyVessels: async function (lat, lon, radiusKm) {
            var url = '/api/vessels/nearby?lat=' + lat + '&lon=' + lon + '&radius_km=' + (radiusKm || 50);
            return await requestJson(url, { method: 'GET' });
        },
        fetchVesselRanking: async function (spillId, maxDistKm, maxHours) {
            var url = '/api/vessels/ranking/' + encodeURIComponent(spillId) +
                      '?max_distance_km=' + (maxDistKm || 60) +
                      '&max_time_hours=' + (maxHours || 12);
            return await requestJson(url, { method: 'GET' });
        },

        // Legacy compatibility methods
        predictImage: async function (imageBlob, filename, timeoutMs, maxRetries, onStatus) {
            var formData = new FormData();
            formData.append('file', imageBlob, filename || 'uploaded_tile.jpg');
            if (onStatus) onStatus("Transmitting SAR image to AI server...");

            var base = getBaseUrl();
            var res = await fetch(base + '/predict', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error("Inference failed (" + res.status + ")");
            return await res.json();
        },
        predictSyntheticPreset: async function (presetName) {
            return await requestJson('/predict-synthetic?preset=' + encodeURIComponent(presetName || 'slick'), {
                method: 'POST'
            });
        },
        fetchRecentHistory: async function (limit, oilOnly) {
            var url = '/history?limit=' + (limit || 50);
            if (oilOnly !== undefined && oilOnly !== null) url += '&oil_only=' + oilOnly;
            return await requestJson(url, { method: 'GET' });
        },
        clearRemoteHistory: async function () {
            return await requestJson('/history', { method: 'DELETE' });
        },
        fetchSampleImageBlob: async function (filename) {
            var base = getBaseUrl();
            var res = await fetch(base + '/samples/' + encodeURIComponent(filename));
            if (!res.ok) throw new Error("Sample file not found");
            return await res.blob();
        }
    };

    global.SentinelAPI = SentinelAPI;
    global.API_BASE_URL = API_BASE_URL;

})(typeof window !== 'undefined' ? window : this);
