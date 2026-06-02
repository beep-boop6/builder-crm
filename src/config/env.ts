const normalizeBaseUrl = (rawUrl?: string): string => {
    const defaultUrl = 'http://localhost:5203';
    const prepared = (rawUrl || defaultUrl).trim();
    const withoutTrailingSlash = prepared.replace(/\/+$/, '');
    return withoutTrailingSlash.replace(/\/api$/i, '');
};

const parseBooleanEnv = (value: string | undefined): boolean => {
    if (!value) {
        return false;
    }

    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export const backendBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
export const apiBaseUrl = `${backendBaseUrl}/api`;
export const isMockEnabled = parseBooleanEnv(import.meta.env.VITE_USE_MOCK);
