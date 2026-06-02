export type FrontendNavigationType = 'sidebar' | 'topbar';
export type BackendNavigationType = 'Side' | 'Top';

export const toBackendNavigation = (value: FrontendNavigationType): BackendNavigationType =>
    value === 'topbar' ? 'Top' : 'Side';

export const fromBackendNavigation = (value: unknown): FrontendNavigationType => {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized === 'top' || normalized === 'topbar' || normalized === '1') {
        return 'topbar';
    }
    return 'sidebar';
};
