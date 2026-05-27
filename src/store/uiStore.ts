import {create} from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ThemeMode = 'light' | 'dark';

export interface UIState {
    isLoading: boolean;
    theme: ThemeMode;
    toasts: Array<{id: number; message: string; type: ToastType}>;
    modals: {
        createProject: boolean;
        deleteConfirm: boolean;
        dbConnection: boolean;
        [key: string]: boolean;
    };
    activeModal: string | null;

    setLoading: (loading: boolean) => void;
    toggleTheme: () => void;
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;

    openModal: (modalName: string) => void;
    closeModal: (modalName: string) => void;
}

const getInitialTheme = (): ThemeMode => {
    if (typeof window === 'undefined') {
        return 'light';
    }
    const stored = localStorage.getItem('builder-crm-theme');
    return stored === 'dark' ? 'dark' : 'light';
};

const applyTheme = (theme: ThemeMode) => {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.dataset.theme = theme;
};

let toastId = 0;

applyTheme(getInitialTheme());

export const useUIStore = create<UIState>((set, get) => ({
    isLoading: false,
    theme: getInitialTheme(),
    toasts: [],
    modals: {
        createProject: false,
        deleteConfirm: false,
        dbConnection: false,
    },
    activeModal: null,

    setLoading: (isLoading) => set({isLoading}),

    toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('builder-crm-theme', nextTheme);
        applyTheme(nextTheme);
        set({ theme: nextTheme });
    },

    showToast: (message, type = 'info') => {
        const id = ++toastId;
        set(state => ({
            toasts: [...state.toasts, {id, message, type}]
        }));
        setTimeout(() => {
            set(state => ({
                toasts: state.toasts.filter(t => t.id !== id)
            }));
        }, 3000);
    },

    removeToast: (id) => set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
    })),

    openModal: (modalName) => set({
        modals: {...useUIStore.getState().modals, [modalName]: true},
        activeModal: modalName
    }),

    closeModal: (modalName) => set({
        modals: {...useUIStore.getState().modals, [modalName]: false},
        activeModal: null
    }),
}));
