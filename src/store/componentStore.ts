import {create} from 'zustand';

export type ComponentType = 'table' | 'chart' | 'button' | 'form' | 'card' | 'filter';

interface ComponentDefinition {
    type: ComponentType;
    name: string;
    defaultWidth: number;
    defaultHeight: number;
    defaultProps: Record<string, unknown>;
    editableFields: string[];
}

interface ComponentStoreState {
    library: Record<ComponentType, ComponentDefinition>;
    componentTemplates: ComponentDefinition[];

    registerComponent: (def: ComponentDefinition) => void;
    getComponentDefinition: (type: ComponentType) => ComponentDefinition | undefined;
    getAllComponents: () => ComponentDefinition[];
}

export const useComponentStore = create<ComponentStoreState>((set, get) => ({
    library: {
        table: {
            type: 'table',
            name: 'Таблица',
            defaultWidth: 400,
            defaultHeight: 300,
            defaultProps: {
                columns: ['Колонка 1', 'Колонка 2', 'Колонка 3'],
                dataSource: [],
                pagination: true,
                rowSelection: false,
            },
            editableFields: ['columns', 'dataSource', 'pagination', 'rowSelection', 'width', 'height', 'x', 'y', 'backgroundColor'],
        },
        chart: {
            type: 'chart',
            name: 'График',
            defaultWidth: 400,
            defaultHeight: 300,
            defaultProps: {
                chartType: 'line',
                data: [],
                xField: 'x',
                yField: 'y',
                color: '#1890ff',
            },
            editableFields: ['chartType', 'data', 'xField', 'yField', 'color', 'width', 'height', 'x', 'y'],
        },
        button: {
            type: 'button',
            name: 'Кнопка',
            defaultWidth: 120,
            defaultHeight: 40,
            defaultProps: {
                text: 'Кнопка',
                variant: 'primary',
                size: 'middle',
            },
            editableFields: ['text', 'variant', 'size', 'width', 'height', 'x', 'y', 'backgroundColor'],
        },
        form: {
            type: 'form',
            name: 'Форма',
            defaultWidth: 400,
            defaultHeight: 300,
            defaultProps: {
                fields: [
                    {name: 'field1', label: 'Поле 1', type: 'text', required: false},
                    {name: 'field2', label: 'Поле 2', type: 'text', required: false},
                ],
                layout: 'vertical',
            },
            editableFields: ['fields', 'layout', 'width', 'height', 'x', 'y'],
        },
        card: {
            type: 'card',
            name: 'Карточка',
            defaultWidth: 300,
            defaultHeight: 200,
            defaultProps: {
                title: 'Заголовок',
                content: 'Содержимое карточки',
                showBorder: true,
                hoverable: false,
            },
            editableFields: ['title', 'content', 'showBorder', 'hoverable', 'width', 'height', 'x', 'y', 'backgroundColor'],
        },
        filter: {
            type: 'filter',
            name: 'Фильтр',
            defaultWidth: 250,
            defaultHeight: 120,
            defaultProps: {
                filterType: 'date',
                placeholder: 'Выберите значение',
                options: [],
                multiSelect: false,
            },
            editableFields: ['filterType', 'placeholder', 'options', 'multiSelect', 'width', 'height', 'x', 'y'],
        },
    },

    componentTemplates: [],

    registerComponent: (def) => set(state => ({
        library: {...state.library, [def.type]: def},
        componentTemplates: [...state.componentTemplates, def],
    })),

    getComponentDefinition: (type) => {
        const state = get();
        return state.library[type];
    },

    getAllComponents: () => {
        const state = get();
        return Object.values(state.library);
    },
}));
