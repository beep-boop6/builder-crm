import {create} from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface UIState {
    isLoading: boolean;
    toasts: Array<{id: number; message: string; type: ToastType}>;
    modals: {
        createProject: boolean;
        deleteConfirm: boolean;
        dbConnection: boolean;
        [key: string]: boolean;
    };
    activeModal: string | null;

    setLoading: (loading: boolean) => void;
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;

    openModal: (modalName: string) => void;
    closeModal: (modalName: string) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
    isLoading: false,
    toasts: [],
    modals: {
        createProject: false,
        deleteConfirm: false,
        dbConnection: false,
    },
    activeModal: null,

    setLoading: (isLoading) => set({isLoading}),

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
