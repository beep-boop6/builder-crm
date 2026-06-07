import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { message } from 'antd';
import { projectService } from '../services/projectService';
import { signalrService } from '../services/signalrService';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { Page } from '../types';
import { generateGuid } from '../utils';
import { titleToRoute } from '@/utils/pageRoute';
import { buildComponentFromSnapshot, type ComponentSnapshot } from '@/utils/componentDefaults';
import { sanitizeEditorComponent } from '@/utils/sanitizeProjectStorage';
import { clampComponentSize } from '@/utils/componentMinSize';
import { useComponentStore } from './componentStore';

const applySizeConstraints = (component: EditorComponent): EditorComponent => {
    const definition = useComponentStore.getState().getComponentDefinition(component.type);
    return { ...component, ...clampComponentSize(component, definition) };
};

const syncPagesWithCurrentComponents = (pages: Page[], currentPageId: string | null, components: EditorComponent[]) =>
    pages.map((page) =>
        page.id === currentPageId ? { ...page, components } : page
    );

const SAVE_DEBOUNCE_MS = 1000;

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight = false;
let savePending = false;

const clearScheduledSave = () => {
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
        saveDebounceTimer = null;
    }
};

const scheduleSaveToProject = (get: () => EditorState) => {
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
    }
    saveDebounceTimer = setTimeout(() => {
        saveDebounceTimer = null;
        void get().saveToProject();
    }, SAVE_DEBOUNCE_MS);
};

const serializeForSync = (component: EditorComponent, pageId: string | null) =>
    JSON.stringify({ ...component, pageId: pageId ?? undefined });

const syncComponentToHub = (component: EditorComponent, pageId: string | null) => {
    if (!pageId) {
        return;
    }
    void signalrService.saveElementPosition(
        component.id,
        pageId,
        serializeForSync(component, pageId)
    );
};

const emitComponentChange = (component: EditorComponent, get: () => EditorState) => {
    syncComponentToHub(component, get().currentPageId);
};

const nextZIndex = (components: EditorComponent[]) =>
    Math.max(1, ...components.map((component) => component.zIndex ?? 1)) + 1;

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
    updateComponent: (
        id: string,
        updates: Partial<EditorComponent>,
        options?: { skipHistory?: boolean; skipSync?: boolean }
    ) => void;
    /**
     * SaveElementPositionAsync — после drag/resize end.
     * overrides — актуальная геометрия с холста (не из API); без них берётся snapshot из store.
     */
    persistComponentPosition: (id: string, overrides?: Partial<EditorComponent>) => void;
    updateComponentProps: (id: string, props: Record<string, any>) => void;
    deleteComponent: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    
    // ЭКШЕНЫ СОКЕТОВ (прием данных от сервера)
    updateElementFromSocket: (id: string, json: string) => void;
    deleteElementFromSocket: (id: string) => void;
    addPageFromSocket: (pageId: string, name: string) => void;
    renamePageFromSocket: (pageId: string, name: string) => void;
    deletePageFromSocket: (pageId: string) => void;
    
    addPage: (title: string, route: string) => void;
    updatePage: (pageId: string, updates: Partial<Pick<Page, 'title' | 'route'>>) => void;
    setCurrentPage: (pageId: string) => void;
    deletePage: (pageId: string) => void;
    deleteComponentOnPage: (pageId: string, componentId: string) => void;
    navigateToPageComponent: (pageId: string, componentId: string) => void;
    getSyncedPages: () => Page[];

    selectComponent: (id: string | null) => void;
    clearSelection: () => void;
    showContextMenu: (x: number, y: number) => void;
    hideContextMenu: () => void;
    initProject: (projectId: string, pages: Page[], legacyComponents?: EditorComponent[]) => void;
    scheduleSaveToProject: () => void;
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

             undo: () => {
                 const state = get();
                 if (state.past.length === 0) {
                     return;
                 }
                 const previous = state.past[state.past.length - 1];
                 const updatedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, previous);
                 set({
                     past: state.past.slice(0, -1),
                     future: [state.components, ...state.future],
                     components: previous,
                     pages: updatedPages,
                     selectedComponentId: null,
                 });
                 scheduleSaveToProject(get);
             },

             redo: () => {
                 const state = get();
                 if (state.future.length === 0) {
                     return;
                 }
                 const next = state.future[0];
                 const updatedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, next);
                 set({
                     past: [...state.past, state.components],
                     future: state.future.slice(1),
                     components: next,
                     pages: updatedPages,
                     selectedComponentId: null,
                 });
                 scheduleSaveToProject(get);
             },

             // ЛОКАЛЬНЫЕ ИЗМЕНЕНИЯ (Отправляем на сервер)
            addComponent: (component) => {
                get().saveHistory();
                const currentComponents = get().components;
                const newComponent: EditorComponent = applySizeConstraints({
                    ...component,
                    id: generateGuid(),
                    zIndex: nextZIndex(currentComponents),
                });

                 const updatedRecent = [
                     component.type,
                     ...get().recentComponents.filter(type => type !== component.type)
                 ].slice(0, 3);

                 set((state) => {
                     const nextComponents = [...state.components, newComponent];
                     return {
                         components: nextComponents,
                         pages: syncPagesWithCurrentComponents(state.pages, state.currentPageId, nextComponents),
                         selectedComponentId: newComponent.id,
                         recentComponents: updatedRecent,
                     };
                 });

                 syncComponentToHub(newComponent, get().currentPageId);
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

             updateComponent: (id, updates, options?: { skipHistory?: boolean; skipSync?: boolean }) => {
                 if (!options?.skipHistory) {
                     get().saveHistory();
                 }
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
                     return {
                         components: newComponents,
                         pages: syncPagesWithCurrentComponents(state.pages, state.currentPageId, newComponents),
                     };
                 });

                 if (updatedComponentData && !options?.skipSync) {
                     emitComponentChange(updatedComponentData, get);
                 }
             },

            persistComponentPosition: (id, overrides) => {
                const pageId = get().currentPageId;
                if (!pageId) {
                    return;
                }

                set((state) => {
                    const existing = state.components.find((item) => item.id === id);
                    if (!existing) {
                        return state;
                    }

                    const merged = applySizeConstraints({ ...existing, ...overrides });
                    const newComponents = state.components.map((item) =>
                        item.id === id ? merged : item
                    );

                    return {
                        components: newComponents,
                        pages: syncPagesWithCurrentComponents(state.pages, pageId, newComponents),
                    };
                });

                const component = get().components.find((item) => item.id === id);
                if (component) {
                    void signalrService.saveElementPosition(
                        component.id,
                        pageId,
                        serializeForSync(component, pageId)
                    );
                }
            },

             updateComponentProps: (id, props) => {
                 get().saveHistory();
                 let updatedComponentData: EditorComponent | null = null;

                 set((state) => {
                     const newComponents = state.components.map((c) => {
                         if (c.id !== id) {
                             return c;
                         }
                         const updated = applySizeConstraints({ ...c, props: { ...c.props, ...props } });
                         updatedComponentData = updated;
                         return updated;
                     });
                     return {
                         components: newComponents,
                         pages: syncPagesWithCurrentComponents(state.pages, state.currentPageId, newComponents),
                     };
                 });

                 if (updatedComponentData) {
                     emitComponentChange(updatedComponentData, get);
                 }
             },

            deleteComponent: (id) => {
                get().saveHistory();
                set((state) => {
                    const nextComponents = state.components.filter(c => c.id !== id);
                    return {
                        components: nextComponents,
                        pages: syncPagesWithCurrentComponents(state.pages, state.currentPageId, nextComponents),
                        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
                    };
                });
                void signalrService.deleteElement(id);
            },

            bringToFront: (id) => {
                get().updateComponent(id, { zIndex: nextZIndex(get().components) });
            },

            sendToBack: (id) => {
                const zIndexes = get().components.map((component) => component.zIndex || 1);
                if (zIndexes.length === 0) {
                    return;
                }
                const minZ = Math.min(...zIndexes);
                get().updateComponent(id, { zIndex: Math.max(1, minZ - 1) });
            },

            // СОБЫТИЯ ОТ СОКЕТОВ (Получаем от сервера)
            updateElementFromSocket: (id, json) => {
                try {
                    const parsed = JSON.parse(json) as EditorComponent & { pageId?: string };
                    const componentId = parsed.id || id;

                    set((state) => {
                        const existing = state.components.find((c) => c.id === componentId);
                        if (!existing) {
                            const created = applySizeConstraints(
                                sanitizeEditorComponent({ ...parsed, id: componentId })
                            );
                            const components = [...state.components, created];
                            return {
                                components,
                                pages: syncPagesWithCurrentComponents(
                                    state.pages,
                                    state.currentPageId,
                                    components
                                ),
                            };
                        }

                        const merged = applySizeConstraints({
                            ...existing,
                            ...parsed,
                            id: componentId,
                        });

                        const socketChangesGeometry =
                            existing.x !== parsed.x ||
                            existing.y !== parsed.y ||
                            existing.width !== parsed.width ||
                            existing.height !== parsed.height;

                        // Эхо с хаба/БД не откатывает только что перетащенный элемент
                        if (state.selectedComponentId === componentId && socketChangesGeometry) {
                            merged.x = existing.x;
                            merged.y = existing.y;
                            merged.width = existing.width;
                            merged.height = existing.height;
                        }

                        const components = state.components.map((c) =>
                            c.id === componentId ? merged : c
                        );
                        return {
                            components,
                            pages: syncPagesWithCurrentComponents(
                                state.pages,
                                state.currentPageId,
                                components
                            ),
                        };
                    });
                } catch (e) {
                    console.error('Ошибка парсинга компонента из сокета:', e);
                }
            },

            deleteElementFromSocket: (id) => {
                set((state) => ({ components: state.components.filter(c => c.id !== id) }));
            },

            addPageFromSocket: (pageId, name) => {
                set((state) => {
                    if (state.pages.some((page) => page.id === pageId)) {
                        return state;
                    }

                    return {
                        pages: [
                            ...state.pages,
                            {
                                id: pageId,
                                title: name,
                                route: titleToRoute(name),
                                components: [],
                                order: state.pages.length + 1,
                            },
                        ],
                    };
                });
            },

            renamePageFromSocket: (pageId, name) => {
                set((state) => ({
                    pages: state.pages.map((page) =>
                        page.id === pageId
                            ? { ...page, title: name, route: titleToRoute(name) }
                            : page
                    ),
                }));
            },

            deletePageFromSocket: (pageId) => {
                const state = get();
                if (state.pages.length <= 1) {
                    return;
                }

                const updatedPages = state.pages.filter((page) => page.id !== pageId);
                if (updatedPages.length === 0) {
                    return;
                }

                const isDeletingCurrent = state.currentPageId === pageId;
                const nextPage = isDeletingCurrent
                    ? updatedPages[0]
                    : updatedPages.find((page) => page.id === state.currentPageId) ?? updatedPages[0];

                set({
                    pages: updatedPages,
                    currentPageId: isDeletingCurrent ? nextPage.id : state.currentPageId,
                    components: isDeletingCurrent ? nextPage.components : state.components,
                    selectedComponentId: null,
                });
            },

            // Страницы и инициализация
            addPage: (title, route) => {
                const pageId = generateGuid();
                set((state) => ({
                    pages: [
                        ...state.pages,
                        { id: pageId, title, route, components: [], order: state.pages.length + 1 },
                    ],
                }));
                void signalrService.createPage(pageId, title);
                scheduleSaveToProject(get);
            },

            updatePage: (pageId, updates) => {
                const nextTitle = updates.title?.trim();
                const nextRoute = updates.route?.trim();

                set((state) => ({
                    pages: state.pages.map((page) => {
                        if (page.id !== pageId) {
                            return page;
                        }
                        return {
                            ...page,
                            title: nextTitle ? nextTitle : page.title,
                            route: nextRoute ? nextRoute : page.route,
                        };
                    }),
                }));

                if (nextTitle) {
                    void signalrService.renamePage(pageId, nextTitle);
                }
                scheduleSaveToProject(get);
            },

            getSyncedPages: () => {
                const state = get();
                return syncPagesWithCurrentComponents(state.pages, state.currentPageId, state.components);
            },

            deletePage: (pageId) => {
                const state = get();
                if (state.pages.length <= 1) {
                    return;
                }

                get().saveHistory();
                const syncedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, state.components);
                const updatedPages = syncedPages.filter((page) => page.id !== pageId);

                if (updatedPages.length === 0) {
                    return;
                }

                const isDeletingCurrent = state.currentPageId === pageId;
                const nextPage = isDeletingCurrent
                    ? updatedPages[0]
                    : updatedPages.find((page) => page.id === state.currentPageId) ?? updatedPages[0];

                set({
                    pages: updatedPages,
                    currentPageId: isDeletingCurrent ? nextPage.id : state.currentPageId,
                    components: isDeletingCurrent ? nextPage.components : state.components,
                    selectedComponentId: null,
                    past: [],
                    future: [],
                });
                void signalrService.deletePage(pageId);
                scheduleSaveToProject(get);
            },

            deleteComponentOnPage: (pageId, componentId) => {
                get().saveHistory();
                set((state) => {
                    const syncedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, state.components);
                    const updatedPages = syncedPages.map((page) =>
                        page.id === pageId
                            ? { ...page, components: page.components.filter((c) => c.id !== componentId) }
                            : page
                    );
                    const isCurrentPage = state.currentPageId === pageId;
                    const nextComponents = isCurrentPage
                        ? updatedPages.find((page) => page.id === pageId)?.components ?? []
                        : state.components;

                    return {
                        pages: updatedPages,
                        components: nextComponents,
                        selectedComponentId:
                            state.selectedComponentId === componentId ? null : state.selectedComponentId,
                    };
                });
                void signalrService.deleteElement(componentId);
            },

            setCurrentPage: (pageId) => {
                set((state) => {
                    const updatedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, state.components);
                    const targetPage = updatedPages.find((p) => p.id === pageId);
                    return {
                        pages: updatedPages,
                        currentPageId: pageId,
                        components: targetPage?.components || [],
                        past: [],
                        future: [],
                        selectedComponentId: null,
                    };
                });
            },

            navigateToPageComponent: (pageId, componentId) => {
                set((state) => {
                    const updatedPages = syncPagesWithCurrentComponents(state.pages, state.currentPageId, state.components);
                    const targetPage = updatedPages.find((page) => page.id === pageId);

                    if (!targetPage) {
                        return state;
                    }

                    const componentExists = targetPage.components.some((c) => c.id === componentId);
                    if (!componentExists) {
                        return state;
                    }

                    return {
                        pages: updatedPages,
                        currentPageId: pageId,
                        components: targetPage.components,
                        selectedComponentId: componentId,
                        past: [],
                        future: [],
                    };
                });
            },

            selectComponent: (id) => set({ selectedComponentId: id }),
            clearSelection: () => set({ selectedComponentId: null }),
            showContextMenu: (x, y) => set({ contextMenu: { x, y, visible: true } }),
            hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

            scheduleSaveToProject: () => scheduleSaveToProject(get),

            initProject: (projectId, pages, legacyComponents) => {
                clearScheduledSave();
                savePending = false;

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
                clearScheduledSave();

                if (saveInFlight) {
                    savePending = true;
                    return;
                }

                const state = get();
                if (!state.projectId) return;

                const updatedPages = syncPagesWithCurrentComponents(
                    state.pages,
                    state.currentPageId,
                    state.components
                );
                const previousPageIndex = state.pages.findIndex(
                    (page) => page.id === state.currentPageId
                );

                saveInFlight = true;
                set({ saving: true, saveError: null });

                try {
                    const savedProject = await projectService.update(state.projectId, {
                        pages: updatedPages,
                    });

                    const nextPages = savedProject.pages;
                    const currentPage =
                        nextPages[previousPageIndex >= 0 ? previousPageIndex : 0] ?? nextPages[0];

                    set({
                        pages: nextPages,
                        currentPageId: currentPage?.id ?? state.currentPageId,
                        components: currentPage?.components ?? state.components,
                    });
                } catch (error) {
                    const errorMessage = getErrorMessage(error, 'Не удалось сохранить проект');
                    set({ saveError: errorMessage });
                    message.error(errorMessage);
                    throw error;
                } finally {
                    saveInFlight = false;
                    set({ saving: false });
                    if (savePending) {
                        savePending = false;
                        void get().saveToProject();
                    }
                }
            },

            clearSaveError: () => set({ saveError: null }),
        }),
        { name: 'editor-store' }
    )
);
