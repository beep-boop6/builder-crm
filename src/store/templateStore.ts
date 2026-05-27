import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Page } from '@/types';
import type { ProjectTemplate } from '@/types/template';
import { generateGuid } from '@/utils';

const SEED_TEMPLATES: Omit<ProjectTemplate, 'createdAt' | 'updatedAt'>[] = [
    {
        id: 'seed-dashboard',
        name: 'Дашборд продаж',
        type: 'dashboard',
        navigationType: 'sidebar',
        pages: [{ id: 'p1', title: 'Главная', route: '/', components: [], order: 1 }],
    },
    {
        id: 'seed-list',
        name: 'Список клиентов',
        type: 'list',
        navigationType: 'sidebar',
        pages: [{ id: 'p1', title: 'Клиенты', route: '/clients', components: [], order: 1 }],
    },
    {
        id: 'seed-detail',
        name: 'Карточка товара',
        type: 'detail',
        navigationType: 'topbar',
        pages: [{ id: 'p1', title: 'Товар', route: '/product', components: [], order: 1 }],
    },
];

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
    return { ...template, createdAt: now, updatedAt: now };
};

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set, get) => ({
            templates: SEED_TEMPLATES.map(withTimestamps),
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

            deleteTemplate: (id) => set((state) => ({
                templates: state.templates.filter((template) => template.id !== id),
            })),

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
        },
    ),
);
