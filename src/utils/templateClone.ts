import type { EditorComponent } from '@/store/editorStore';
import type { Page } from '@/types';
import { generateGuid } from '@/utils';
import { normalizeTemplateComponents } from '@/utils/templateLayout';

const remapId = (id: string, map: Map<string, string>): string => map.get(id) ?? id;

const remapComponentProps = (
    props: Record<string, unknown>,
    componentIdMap: Map<string, string>,
    pageIdMap: Map<string, string>
): Record<string, unknown> => {
    const next: Record<string, unknown> = { ...props };

    if (Array.isArray(next.targetComponentIds)) {
        next.targetComponentIds = next.targetComponentIds.map((id) =>
            remapId(String(id), componentIdMap)
        );
    }

    if (typeof next.targetPageId === 'string' && next.targetPageId) {
        next.targetPageId = remapId(next.targetPageId, pageIdMap);
    }

    return next;
};

const remapComponent = (
    component: EditorComponent,
    componentIdMap: Map<string, string>,
    pageIdMap: Map<string, string>
): EditorComponent => ({
    ...component,
    id: componentIdMap.get(component.id) ?? generateGuid(),
    props: component.props
        ? remapComponentProps(
            component.props as Record<string, unknown>,
            componentIdMap,
            pageIdMap
        )
        : component.props,
});

/**
 * Клонирует страницы шаблона для нового проекта с уникальными GUID.
 * Бэкенд хранит элементы по Id глобально — повторное использование id шаблона
 * перезаписывает компоненты предыдущего проекта и даёт пустой холст.
 */
export const cloneTemplatePagesForProject = (
    templatePages: Page[],
    defaultPageId: string
): Page[] => {
    const pageIdMap = new Map<string, string>();
    templatePages.forEach((page, index) => {
        pageIdMap.set(page.id, index === 0 ? defaultPageId : generateGuid());
    });

    const componentIdMap = new Map<string, string>();
    templatePages.forEach((page) => {
        normalizeTemplateComponents(page.components).forEach((component) => {
            componentIdMap.set(component.id, generateGuid());
        });
    });

    return templatePages.map((page) => {
        const normalizedComponents = normalizeTemplateComponents(page.components);
        return {
            ...page,
            id: pageIdMap.get(page.id) ?? generateGuid(),
            components: normalizedComponents.map((component) =>
                remapComponent(component, componentIdMap, pageIdMap)
            ),
        };
    });
};
