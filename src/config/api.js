/**
 * Sentinel-1 SAR Oil Spill Classification Platform
 * Centralized API Configuration (ES Module)
 */

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

function resolveApiBaseUrl() {
    // 1. User manual override stored in localStorage via the UI settings modal
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('sih_sar_api_url');
            if (stored && stored.trim()) {
                return stored.trim().replace(/\/+$/, '');
            }
        }
    } catch (e) {}

    // 2. Vite / Bundler environment variable
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
            const envUrl = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
            if (envUrl && !envUrl.includes('YOUR-DEPLOYED-BACKEND-URL')) {
                return envUrl;
            }
        }
    } catch (e) {}

    // 3. Runtime window injection
    if (typeof window !== 'undefined') {
        const winUrl = window.__ENV__?.VITE_API_URL || window.VITE_API_URL;
        if (winUrl && winUrl.trim() && !winUrl.includes('YOUR-DEPLOYED-BACKEND-URL')) {
            return winUrl.trim().replace(/\/+$/, '');
        }
    }

    // 4. Localhost ONLY for local development
    if (isLocalEnvironment()) {
        return 'http://localhost:8000';
    }

    // 5. In production, return empty if not yet configured
    return '';
}

export const API_BASE_URL = resolveApiBaseUrl();
export default API_BASE_URL;
