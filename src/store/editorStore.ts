import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { message } from 'antd';
import { projectService } from '../services/projectService';
import { elementService } from '../services/elementService';
import { signalrService } from '../services/signalrService';
import { isMockEnabled } from '@/config/env';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { Page } from '../types';
import { generateGuid } from '../utils';
import { buildComponentFromSnapshot, type ComponentSnapshot } from '@/utils/componentDefaults';
import { sanitizeEditorComponent } from '@/utils/sanitizeProjectStorage';
import { clampComponentSize } from '@/utils/componentMinSize';
import { useComponentStore } from './componentStore';

const applySizeConstraints = (component: EditorComponent): EditorComponent => {
    const definition = useComponentStore.getState().getComponentDefinition(component.type);
    return { ...component, ...clampComponentSize(component, definition) };
};

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
    saving: boolean;
    saveError: string | null;
    
    saveHistory: () => void;
    undo: () => void;
    redo: () => void;
    
    addComponent: (component: Omit<EditorComponent, 'id'>) => void;
    duplicateComponent: (id: string, offset?: { x: number; y: number }) => void;
    addComponentFromSnapshot: (snapshot: Omit<EditorComponent, 'id' | 'x' | 'y'>, position: { x: number; y: number }) => void;
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
    clearSaveError: () => void;
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
             saving: false,
             saveError: null,

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

            addComponentFromSnapshot: (snapshot, position) => {
                const component = buildComponentFromSnapshot(snapshot as ComponentSnapshot, position);
                get().addComponent(component);
            },

            duplicateComponent: (id, offset = { x: 20, y: 20 }) => {
                const source = get().components.find((component) => component.id === id);
                if (!source) {
                    return;
                }

                const { id: _id, x, y, ...snapshot } = source;
                get().addComponentFromSnapshot(snapshot, { x: x + offset.x, y: y + offset.y });
            },

             updateComponent: (id, updates) => {
                 get().saveHistory();
                 let updatedComponentData: EditorComponent | null = null;
                 
                 set((state) => {
                     const newComponents = state.components.map(c => {
                         if (c.id === id) {
                             const updated = applySizeConstraints({ ...c, ...updates });
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
                     components: state.components.map((c) =>
                         c.id === id
                             ? applySizeConstraints({ ...c, props: { ...c.props, ...props } })
                             : c
                     ),
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
                const rawPages: Page[] =
                    pages?.length > 0
                        ? pages
                        : [{ id: 'default', title: 'Главная', route: '/', components: legacyComponents || [], order: 1 }];

                const initialPages = rawPages.map((page) => ({
                    ...page,
                    components: (page.components ?? []).map((component) => sanitizeEditorComponent(component)),
                }));

                set({
                    projectId,
                    pages: initialPages,
                    currentPageId: initialPages[0].id,
                    components: initialPages[0].components || [],
                    selectedComponentId: null,
                    past: [],
                    future: [],
                });
            },

            saveToProject: async () => {
                const state = get();
                if (!state.projectId) return;

                const updatedPages = state.pages.map((page) =>
                    page.id === state.currentPageId
                        ? { ...page, components: state.components }
                        : page
                );

                set({ saving: true, saveError: null });

                try {
                    await projectService.update(state.projectId, { pages: updatedPages });

                    if (!isMockEnabled) {
                        const idRemaps = await elementService.syncProjectElements(
                            state.projectId,
                            updatedPages
                        );

                        if (Object.keys(idRemaps).length > 0) {
                            const remappedPages = updatedPages.map((page) => ({
                                ...page,
                                components: page.components.map((component) => ({
                                    ...component,
                                    id: idRemaps[component.id] ?? component.id,
                                })),
                            }));

                            const currentPage = remappedPages.find((page) => page.id === state.currentPageId);
                            set({
                                pages: remappedPages,
                                components: currentPage?.components ?? state.components,
                            });
                            return;
                        }
                    }

                    set({ pages: updatedPages });
                } catch (error) {
                    const errorMessage = getErrorMessage(error, 'Не удалось сохранить проект');
                    set({ saveError: errorMessage });
                    message.error(errorMessage);
                    throw error;
                } finally {
                    set({ saving: false });
                }
            },

            clearSaveError: () => set({ saveError: null }),
        }),
        { name: 'editor-store' }
    )
);
