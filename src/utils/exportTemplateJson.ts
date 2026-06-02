import type { Page } from '@/types';
import type { ProjectTemplate } from '@/types/template';
import type { EditorComponent } from '@/store/editorStore';

/** Формат одного элемента, как уходит в SignalR / REST (`json` поля элемента). */
export type TemplateElementPayload = EditorComponent & { pageId?: string };

export interface TemplateExportPayload {
    templateId: string;
    templateName: string;
    templateType: string;
    navigationType: 'sidebar' | 'topbar';
    pages: Array<{
        id: string;
        title: string;
        route: string;
        order: number;
        elements: TemplateElementPayload[];
    }>;
}

export const buildTemplateExportPayload = (template: ProjectTemplate): TemplateExportPayload => ({
    templateId: template.id,
    templateName: template.name,
    templateType: template.type,
    navigationType: template.navigationType,
    pages: template.pages.map((page) => ({
        id: page.id,
        title: page.title,
        route: page.route,
        order: page.order,
        elements: page.components.map((component) => ({
            ...component,
            pageId: page.id,
        })),
    })),
});

export const buildTemplateExportJson = (template: ProjectTemplate, pretty = true): string =>
    JSON.stringify(buildTemplateExportPayload(template), null, pretty ? 2 : 0);

export const buildAllTemplatesExportJson = (templates: ProjectTemplate[], pretty = true): string =>
    JSON.stringify(templates.map(buildTemplateExportPayload), null, pretty ? 2 : 0);

/** Снимок страниц проекта в том же формате, что и шаблон. */
export const buildPagesExportPayload = (
    pages: Page[],
    meta: { projectId: string; projectName: string },
): { projectId: string; projectName: string; pages: TemplateExportPayload['pages'] } => ({
    projectId: meta.projectId,
    projectName: meta.projectName,
    pages: pages.map((page) => ({
        id: page.id,
        title: page.title,
        route: page.route,
        order: page.order,
        elements: page.components.map((component) => ({
            ...component,
            pageId: page.id,
        })),
    })),
});
