import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Page } from '@/types';
import type { ProjectTemplate } from '@/types/template';
import { generateGuid } from '@/utils';
import { normalizeTemplateComponents } from '@/utils/templateLayout';
import { SYSTEM_TEMPLATES } from '@/data/systemTemplates';

interface TemplateState {
    templates: ProjectTemplate[];
    selectedType: string;
    setSelectedType: (type: string) => void;
    saveFromProject: (payload: {
        name: string;
        type: string;
        pages: Page[];
        navigationType: 'sidebar' | 'topbar';
        sourceProjectId?: string;
    }) => ProjectTemplate;
    deleteTemplate: (id: string) => void;
    getFilteredTemplates: () => ProjectTemplate[];
}

const withTimestamps = (
    template: Omit<ProjectTemplate, 'createdAt' | 'updatedAt'>,
): ProjectTemplate => {
    const now = Date.now();
    return {
        ...template,
        pages: template.pages.map((page) => ({
            ...page,
            components: normalizeTemplateComponents(page.components),
        })),
        createdAt: now,
        updatedAt: now,
    };
};

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set, get) => ({
            templates: SYSTEM_TEMPLATES.map(withTimestamps),
            selectedType: 'all',

            setSelectedType: (type) => set({ selectedType: type }),

            saveFromProject: ({ name, type, pages, navigationType, sourceProjectId }) => {
                const now = Date.now();
                const template: ProjectTemplate = {
                    id: generateGuid(),
                    name: name.trim() || 'Без названия',
                    type,
                    pages: pages.map((page) => ({
                        ...page,
                        components: page.components.map((component) => ({ ...component })),
                    })),
                    navigationType,
                    sourceProjectId,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    templates: [template, ...state.templates],
                }));

                return template;
            },

            deleteTemplate: (id) => {
                if (SYSTEM_TEMPLATES.some((template) => template.id === id)) {
                    return;
                }
                set((state) => ({
                    templates: state.templates.filter((template) => template.id !== id),
                }));
            },

            getFilteredTemplates: () => {
                const { templates, selectedType } = get();
                if (selectedType === 'all') {
                    return templates;
                }
                return templates.filter((template) => template.type === selectedType);
            },
        }),
        {
            name: 'builder_crm_project_templates',
            version: 4,
            migrate: (persistedState, version) => {
                const state = persistedState as TemplateState | undefined;
                if (version < 2 || !state) {
                    return {
                        templates: SYSTEM_TEMPLATES.map(withTimestamps),
                        selectedType: state?.selectedType ?? 'all',
                    };
                }
                if (version < 4) {
                    const systemIds = new Set(SYSTEM_TEMPLATES.map((t) => t.id));
                    const userTemplates = (state.templates ?? [])
                        .filter((t) => !systemIds.has(t.id))
                        .map((template) => ({
                            ...template,
                            pages: template.pages.map((page) => ({
                                ...page,
                                components: normalizeTemplateComponents(page.components),
                            })),
                        }));
                    return {
                        ...state,
                        templates: [
                            ...SYSTEM_TEMPLATES.map(withTimestamps),
                            ...userTemplates,
                        ],
                    };
                }
                return state;
            },
        },
    ),
);
