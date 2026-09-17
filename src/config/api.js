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
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('sih_sar_api_url') : null;
    if (stored && stored.trim()) {
        return stored.trim().replace(/\/+$/, '');
    }

    // 2. Vite / Bundler environment variable
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
        }
    } catch (e) {
        // ignore
    }

    // 3. Runtime window injection
    if (typeof window !== 'undefined') {
        if (window.__ENV__ && window.__ENV__.VITE_API_URL) {
            return window.__ENV__.VITE_API_URL.replace(/\/+$/, '');
        }
        if (window.VITE_API_URL) {
            return window.VITE_API_URL.replace(/\/+$/, '');
        }
    }

    // 4. Localhost ONLY for local development
    if (isLocalEnvironment()) {
        return 'http://localhost:8000';
    }

    // 5. Production placeholder for cloud deployment
    return 'https://YOUR-BACKEND-DOMAIN';
}

export const API_BASE_URL = resolveApiBaseUrl();
export default API_BASE_URL;
