const normalizeBaseUrl = (rawUrl?: string): string => {
    const defaultUrl = 'http://localhost:5203';
    const prepared = (rawUrl || defaultUrl).trim();
    const withoutTrailingSlash = prepared.replace(/\/+$/, '');
    return withoutTrailingSlash.replace(/\/api$/i, '');
};

export const backendBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
export const apiBaseUrl = `${backendBaseUrl}/api`;
export const isMockEnabled = false;
