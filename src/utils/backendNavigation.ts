export type FrontendNavigationType = 'sidebar' | 'topbar';

/** Бэкенд: NavigationType enum — Top = 0, Side = 1 */
export type BackendNavigationType = 0 | 1;

export const NAVIGATION_TOP = 0 as const;
export const NAVIGATION_SIDE = 1 as const;

export const toBackendNavigation = (value: FrontendNavigationType): BackendNavigationType =>
    value === 'topbar' ? NAVIGATION_TOP : NAVIGATION_SIDE;

export const fromBackendNavigation = (value: unknown): FrontendNavigationType => {
    if (value === NAVIGATION_TOP || value === '0' || value === 0) {
        return 'topbar';
    }

    if (value === NAVIGATION_SIDE || value === '1' || value === 1) {
        return 'sidebar';
    }

    const normalized = String(value ?? '').toLowerCase();
    if (normalized === 'top' || normalized === 'topbar') {
        return 'topbar';
    }

    return 'sidebar';
};
