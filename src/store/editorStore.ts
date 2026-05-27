import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { projectService } from '../services/projectService';
import { signalrService } from '../services/signalrService';
import { Page } from '../types';
import { generateGuid } from '../utils';

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
    zIndex?: number;
    props?: Record<string, any>;
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
    recentComponents: string[];
    
    saveHistory: () => void;
    undo: () => void;
    redo: () => void;
    
    addComponent: (component: Omit<EditorComponent, 'id'>) => void;
    updateComponent: (id: string, updates: Partial<EditorComponent>) => void;
    updateComponentProps: (id: string, props: Record<string, any>) => void;
    deleteComponent: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    
    // ЭКШЕНЫ СОКЕТОВ (прием данных от сервера)
    updateElementFromSocket: (id: string, json: string) => void;
    deleteElementFromSocket: (id: string) => void;
    
    addPage: (title: string, route: string) => void;
    setCurrentPage: (pageId: string) => void;
    deletePage: (pageId: string) => void;

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
             recentComponents: [],

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

             // ЛОКАЛЬНЫЕ ИЗМЕНЕНИЯ (Отправляем на сервер)
            addComponent: (component) => {
                get().saveHistory();
                const newComponent: EditorComponent = {
                    ...component,
                    id: generateGuid(),
                    zIndex: 1,
                };
                 
                 // Обновляем список недавних компонентов (максимум 3, без дублей)
                 const updatedRecent = [
                     component.type, 
                     ...get().recentComponents.filter(type => type !== component.type)
                 ].slice(0, 3);
                 
                 set((state) => ({ 
                     components: [...state.components, newComponent], 
                     selectedComponentId: newComponent.id,
                     recentComponents: updatedRecent
                 }));
                 
                 // Транслируем всем через сокет
                 signalrService.sendElementState(newComponent.id, JSON.stringify(newComponent));
             },

             updateComponent: (id, updates) => {
                 get().saveHistory();
                 let updatedComponentData: EditorComponent | null = null;
                 
                 set((state) => {
                     const newComponents = state.components.map(c => {
                         if (c.id === id) {
                             const updated = { ...c, ...updates };
                             updatedComponentData = updated;
                             return updated;
                         }
                         return c;
                     });
                     return { components: newComponents };
                 });

                 if (updatedComponentData) {
                     signalrService.sendElementState(id, JSON.stringify(updatedComponentData));
                 }
             },

             updateComponentProps: (id, props) => {
                 get().saveHistory();
                 set((state) => ({
                     components: state.components.map(c => 
                         c.id === id ? { ...c, props: { ...c.props, ...props } } : c
                     )
                 }));
             },

            deleteComponent: (id) => {
                get().saveHistory();
                set((state) => ({ components: state.components.filter(c => c.id !== id), selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId }));
                signalrService.deleteElement(id);
            },

            bringToFront: (id) => {
                get().updateComponent(id, { zIndex: Math.max(0, ...get().components.map(c => c.zIndex || 1)) + 1 });
            },

            sendToBack: (id) => {
                get().updateComponent(id, { zIndex: Math.min(2, ...get().components.map(c => c.zIndex || 1)) - 1 });
            },

            // СОБЫТИЯ ОТ СОКЕТОВ (Получаем от сервера)
            updateElementFromSocket: (id, json) => {
                try {
                    const parsed = JSON.parse(json) as EditorComponent;
                    set((state) => {
                        const exists = state.components.some(c => c.id === id);
                        if (exists) {
                            return { components: state.components.map(c => c.id === id ? { ...c, ...parsed } : c) };
                        }
                        return { components: [...state.components, parsed] };
                    });
                } catch (e) {
                    console.error('Ошибка парсинга компонента из сокета:', e);
                }
            },

            deleteElementFromSocket: (id) => {
                set((state) => ({ components: state.components.filter(c => c.id !== id) }));
            },

            // Страницы и инициализация
            addPage: (title, route) => {
                set((state) => {
                    const newPage: Page = { id: generateGuid(), title, route, components: [], order: state.pages.length + 1 };
                    return { pages: [...state.pages, newPage] };
                });
                get().saveToProject();
            },

            deletePage: (pageId) => {
                set((state) => ({ pages: state.pages.filter(p => p.id !== pageId) }));
                get().saveToProject();
            },

            setCurrentPage: (pageId) => {
                set((state) => {
                    const updatedPages = state.pages.map(p => p.id === state.currentPageId ? { ...p, components: state.components } : p);
                    const targetPage = updatedPages.find(p => p.id === pageId);
                    return { pages: updatedPages, currentPageId: pageId, components: targetPage?.components || [], past: [], future: [], selectedComponentId: null };
                });
            },

            selectComponent: (id) => set({ selectedComponentId: id }),
            clearSelection: () => set({ selectedComponentId: null }),
            showContextMenu: (x, y) => set({ contextMenu: { x, y, visible: true } }),
            hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

            initProject: (projectId, pages, legacyComponents) => {
                const initialPages = pages?.length > 0 ? pages : [{ id: 'default', title: 'Главная', route: '/', components: legacyComponents || [], order: 1 }];
                set({ projectId, pages: initialPages, currentPageId: initialPages[0].id, components: initialPages[0].components || [], selectedComponentId: null, past: [], future: [] });
            },

            saveToProject: async () => {
                const state = get();
                if (!state.projectId) return;
                const updatedPages = state.pages.map(p => p.id === state.currentPageId ? { ...p, components: state.components } : p);
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
