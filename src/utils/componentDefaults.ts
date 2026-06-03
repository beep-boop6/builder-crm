import type { ComponentDefinition } from '@/store/componentStore';
import type { EditorComponent } from '@/store/editorStore';
import { generateGuid } from '@/utils';
import { DEFAULT_CONTACT_CARD_PROPS } from '@/utils/contactCardDefaults';
import { isCardComponentType } from '@/utils/componentFilters';
import { resolveFormHeight } from '@/utils/formLayout';

export type ComponentSnapshot = Omit<EditorComponent, 'id' | 'x' | 'y'>;

export const buildComponentFromDefinition = (
    type: string,
    definition: ComponentDefinition | undefined,
    position: { x: number; y: number }
): Omit<EditorComponent, 'id'> => {
    const fallback = {
        width: 200,
        height: 100,
        text: 'Новый элемент',
        backgroundColor: '#f0f0f0',
        color: '#333333',
        borderRadius: 4,
    };

    if (!definition) {
        return {
            type,
            x: position.x,
            y: position.y,
            ...fallback,
        };
    }

    const isCard = isCardComponentType(type);
    const cardProps = type === 'card'
        ? {
              ...structuredClone(DEFAULT_CONTACT_CARD_PROPS),
              phones: DEFAULT_CONTACT_CARD_PROPS.phones.map((phone) => ({
                  ...phone,
                  id: generateGuid(),
              })),
          }
        : structuredClone(definition.defaultProps);

    const defaultText = type === 'card'
        ? DEFAULT_CONTACT_CARD_PROPS.fullName
        : type === 'filter'
            ? String(definition.defaultProps.label ?? 'Фильтр')
            : String(definition.defaultProps.text ?? definition.name);

    const baseHeight = type === 'form'
        ? resolveFormHeight(
            {
                type,
                width: definition.defaultWidth,
                height: definition.defaultHeight,
                props: cardProps,
            },
            definition
        )
        : definition.defaultHeight;

    return {
        type,
        x: position.x,
        y: position.y,
        width: definition.defaultWidth,
        height: baseHeight,
        text: defaultText,
        backgroundColor:
            type === 'table' || type === 'chart' || isCard || type === 'form' || type === 'filter'
                ? '#ffffff'
                : '#155DA4',
        color:
            type === 'table'
                ? '#000000'
                : type === 'chart' || isCard || type === 'form' || type === 'filter'
                    ? '#333333'
                    : '#ffffff',
        borderRadius: 12,
        props: isCard
            ? { ...cardProps, borderWidth: 1, borderColor: '#E8E8E8' }
            : type === 'chart'
                ? { ...structuredClone(definition.defaultProps), borderWidth: 1, borderColor: '#E8E8E8', color: '#E8E8E8' }
                : { ...structuredClone(definition.defaultProps), borderWidth: 1, borderColor: '#E8E8E8' },
    };
};

export const buildComponentFromSnapshot = (
    snapshot: ComponentSnapshot,
    position: { x: number; y: number }
): Omit<EditorComponent, 'id'> => ({
    ...structuredClone(snapshot),
    x: position.x,
    y: position.y,
});
