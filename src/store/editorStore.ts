import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { projectService } from '../services/projectService';
import { Page } from '../types';

export interface EditorComponent {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor: string;
    text: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    borderRadius?: number;
    zIndex?: number; // Добавлено для слоев
}

interface EditorState {
    projectId: string | null;
    pages: Page[];
    currentPageId: string | null;
    
    components: EditorComponent[];
    past: EditorComponent[][];
    future: EditorComponent[][];
    selectedComponentId: string | null;
    contextMenu: { x: number; y: number; visible: boolean; };
    
    // История
    saveHistory: () => void;
    undo: () => void;
    redo: () => void;
    
    // Компоненты
    addComponent: (component: Omit<EditorComponent, 'id'>) => void;
    updateComponent: (id: string, updates: Partial<EditorComponent>) => void;
    deleteComponent: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    
    // Страницы
    addPage: (title: string, route: string) => void;
    setCurrentPage: (pageId: string) => void;
    deletePage: (pageId: string) => void;

    // UI и Инициализация
    selectComponent: (id: string | null) => void;
    clearSelection: () => void;
    showContextMenu: (x: number, y: number) => void;
    hideContextMenu: () => void;
    initProject: (projectId: string, pages: Page[], legacyComponents?: EditorComponent[]) => void;
    saveToProject: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        (set, get) => ({
            projectId: null,
            pages: [],
            currentPageId: null,
            components: [],
            past: [],
            future: [],
            selectedComponentId: null,
            contextMenu: { x: 0, y: 0, visible: false },

            saveHistory: () => set((state) => ({ past: [...state.past, state.components], future: [] })),

            undo: () => set((state) => {
                if (state.past.length === 0) return state;
                const previous = state.past[state.past.length - 1];
                return { past: state.past.slice(0, -1), future: [state.components, ...state.future], components: previous, selectedComponentId: null };
            }),

            redo: () => set((state) => {
                if (state.future.length === 0) return state;
                const next = state.future[0];
                return { past: [...state.past, state.components], future: state.future.slice(1), components: next, selectedComponentId: null };
            }),

            addComponent: (component) => {
                get().saveHistory();
                const newComponent: EditorComponent = {
                    ...component,
                    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    zIndex: 1, // Дефолтный слой
                };
                set((state) => ({ components: [...state.components, newComponent], selectedComponentId: newComponent.id }));
            },

            updateComponent: (id, updates) => {
                get().saveHistory();
                set((state) => ({ components: state.components.map(c => c.id === id ? { ...c, ...updates } : c) }));
            },

            deleteComponent: (id) => {
                get().saveHistory();
                set((state) => ({ components: state.components.filter(c => c.id !== id), selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId }));
            },

            bringToFront: (id) => {
                get().saveHistory();
                set((state) => {
                    const maxZ = Math.max(0, ...state.components.map(c => c.zIndex || 1));
                    return { components: state.components.map(c => c.id === id ? { ...c, zIndex: maxZ + 1 } : c) };
                });
            },

            sendToBack: (id) => {
                get().saveHistory();
                set((state) => {
                    const minZ = Math.min(2, ...state.components.map(c => c.zIndex || 1));
                    return { components: state.components.map(c => c.id === id ? { ...c, zIndex: minZ - 1 } : c) };
                });
            },

            addPage: (title, route) => {
                set((state) => {
                    const newPage: Page = { id: `page_${Date.now()}`, title, route, components: [], order: state.pages.length + 1 };
                    return { pages: [...state.pages, newPage] };
                });
                get().saveToProject();
            },

            deletePage: (pageId) => {
                set((state) => {
                    const newPages = state.pages.filter(p => p.id !== pageId);
                    return { pages: newPages };
                });
                get().saveToProject();
            },

            setCurrentPage: (pageId) => {
                set((state) => {
                    // Сохраняем текущие компоненты в текущую страницу перед переключением
                    const updatedPages = state.pages.map(p => 
                        p.id === state.currentPageId ? { ...p, components: state.components } : p
                    );
                    const targetPage = updatedPages.find(p => p.id === pageId);
                    return {
                        pages: updatedPages,
                        currentPageId: pageId,
                        components: targetPage?.components || [],
                        past: [], future: [], selectedComponentId: null
                    };
                });
            },

            selectComponent: (id) => set({ selectedComponentId: id }),
            clearSelection: () => set({ selectedComponentId: null }),
            showContextMenu: (x, y) => set({ contextMenu: { x, y, visible: true } }),
            hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

            initProject: (projectId, pages, legacyComponents) => {
                // Если старый проект без страниц, создаем фейковую
                const initialPages = pages?.length > 0 ? pages : [{
                    id: 'default', title: 'Главная', route: '/', components: legacyComponents || [], order: 1
                }];
                set({ 
                    projectId, 
                    pages: initialPages,
                    currentPageId: initialPages[0].id,
                    components: initialPages[0].components || [], 
                    selectedComponentId: null, past: [], future: []
                });
            },

            saveToProject: async () => {
                const state = get();
                if (!state.projectId) return;
                
                // Синхронизируем текущий холст со страницей перед сохранением
                const updatedPages = state.pages.map(p => 
                    p.id === state.currentPageId ? { ...p, components: state.components } : p
                );
                
                try {
                    await projectService.update(state.projectId, { pages: updatedPages });
                    set({ pages: updatedPages });
                } catch (error) {
                    console.error('Ошибка сохранения:', error);
                }
            },
        }),
        { name: 'editor-store' }
    )
);
