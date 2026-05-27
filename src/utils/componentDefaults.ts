import type { ComponentDefinition } from '@/store/componentStore';
import type { EditorComponent } from '@/store/editorStore';
import { generateGuid } from '@/utils';
import { DEFAULT_CONTACT_CARD_PROPS } from '@/utils/contactCardDefaults';

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

    const cardProps =
        type === 'card'
            ? {
                  ...structuredClone(DEFAULT_CONTACT_CARD_PROPS),
                  phones: DEFAULT_CONTACT_CARD_PROPS.phones.map((phone) => ({
                      ...phone,
                      id: generateGuid(),
                  })),
              }
            : structuredClone(definition.defaultProps);

    return {
        type,
        x: position.x,
        y: position.y,
        width: definition.defaultWidth,
        height: definition.defaultHeight,
        text:
            type === 'card'
                ? DEFAULT_CONTACT_CARD_PROPS.fullName
                : String(definition.defaultProps.text ?? definition.name),
        backgroundColor:
            type === 'table' || type === 'chart' || type === 'card' ? '#ffffff' : '#155DA4',
        color: type === 'table' ? '#000000' : type === 'chart' || type === 'card' ? '#333333' : '#ffffff',
        borderRadius: type === 'button' || type === 'card' ? 8 : 4,
        props: cardProps,
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
