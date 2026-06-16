import {create} from 'zustand';
import { persist } from 'zustand/middleware';

export interface ComponentDefinition {
    type: string;
    name: string;
    category: string;
    defaultWidth: number;
    defaultHeight: number;
    defaultProps: Record<string, unknown>;
    editableFields: string[];
    isBuiltIn?: boolean;
    enabled?: boolean;
}

interface ComponentStoreState {
    library: Record<string, ComponentDefinition>;
    registerComponent: (def: ComponentDefinition) => void;
    updateComponent: (type: string, updates: Partial<ComponentDefinition>) => void;
    removeComponent: (type: string) => void;
    setComponentEnabled: (type: string, enabled: boolean) => void;
    getComponentDefinition: (type: string) => ComponentDefinition | undefined;
    getAllComponents: () => ComponentDefinition[];
    getActiveComponents: () => ComponentDefinition[];
}

const DEFAULT_LIBRARY: Record<string, ComponentDefinition> = {
    table: {
        type: 'table',
        name: 'Таблица',
        category: 'data',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
            columns: ['Колонка 1', 'Колонка 2', 'Колонка 3'],
            dataSource: [],
            pagination: true,
            rowSelection: false,
        },
        editableFields: ['columns', 'dataSource', 'pagination', 'rowSelection', 'width', 'height', 'x', 'y', 'backgroundColor'],
        isBuiltIn: true,
        enabled: true,
    },
    chart: {
        type: 'chart',
        name: 'График',
        category: 'data',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
            chartType: 'line',
            tableComponentId: '',
            chartMapping: { xField: '', yField: '' },
            xAxisKey: '',
            yAxisKey: '',
            backgroundColor: '#FFFFFF',
            style: { color: '#155DA4', backgroundColor: '#FFFFFF' },
        },
        editableFields: ['chartType', 'tableComponentId', 'chartMapping', 'color', 'backgroundColor', 'width', 'height', 'x', 'y'],
        isBuiltIn: true,
        enabled: true,
    },
    button: {
        type: 'button',
        name: 'Кнопка',
        category: 'basic',
        defaultWidth: 120,
        defaultHeight: 40,
        defaultProps: {
            text: 'Кнопка',
            variant: 'primary',
            size: 'middle',
            targetPageId: '',
        },
        editableFields: ['text', 'targetPageId', 'variant', 'size', 'width', 'height', 'x', 'y', 'backgroundColor'],
        isBuiltIn: true,
        enabled: true,
    },
    form: {
        type: 'form',
        name: 'Форма',
        category: 'input',
        defaultWidth: 400,
        defaultHeight: 300,
        defaultProps: {
            formMode: 'default',
            fields: [
                { name: 'header', label: 'Заголовок', type: 'text', required: true, placeholder: 'Заголовок' },
                { name: 'value1', label: 'Значение', type: 'text', placeholder: '' },
            ],
            layout: 'column',
            textAlign: 'left',
            submitLabel: 'Добавить колонку',
            formValues: {},
            appliedFormValues: {},
            targetComponentIds: [],
            searchFieldKey: 'text',
            searchValue: '',
            appliedSearchValue: '',
        },
        editableFields: ['fields', 'layout', 'formMode', 'width', 'height', 'x', 'y'],
        isBuiltIn: true,
        enabled: true,
    },
    filter: {
        type: 'filter',
        name: 'Фильтр',
        category: 'filters',
        defaultWidth: 280,
        defaultHeight: 96,
        defaultProps: {
            filterType: 'status',
            fieldKey: '',
            label: 'Фильтр',
            value: '',
            targetComponentIds: [],
        },
        editableFields: ['filterType', 'fieldKey', 'label', 'value', 'targetComponentIds'],
        isBuiltIn: true,
        enabled: true,
    },
    card: {
        type: 'card',
        name: 'Карточка',
        category: 'cards',
        defaultWidth: 320,
        defaultHeight: 400,
        defaultProps: {
            fullName: 'Иван Иванов',
            organization: 'ООО «Пример»',
            email: 'ivan@example.com',
            description: 'Менеджер по работе с клиентами',
            photoUrl: '',
            photoId: '',
            phones: [{ id: 'default-phone', number: '+7 (999) 123-45-67' }],
            textAlign: 'left',
            coverType: 'gradient',
            coverColor: '#155DA4',
            coverImageId: '',
        },
        editableFields: [
            'fullName',
            'organization',
            'email',
            'description',
            'photoId',
            'phones',
            'textAlign',
            'coverType',
            'coverColor',
            'coverImageId',
            'width',
            'height',
            'x',
            'y',
            'backgroundColor',
        ],
        isBuiltIn: true,
        enabled: true,
    },
    'card-deal': {
        type: 'card-deal',
        name: 'Карточка сделки',
        category: 'cards',
        defaultWidth: 300,
        defaultHeight: 160,
        defaultProps: {
            dealTitle: 'Новая сделка',
            clientName: 'ООО «Пример»',
            dealStatus: 'Переговоры',
            dealAmount: '150 000',
        },
        editableFields: ['dealTitle', 'clientName', 'dealStatus', 'dealAmount'],
        isBuiltIn: true,
        enabled: true,
    },
    'card-summary': {
        type: 'card-summary',
        name: 'Карточка итогов',
        category: 'cards',
        defaultWidth: 280,
        defaultHeight: 180,
        defaultProps: {
            totalIncome: '1 250 000',
            totalExpense: '820 000',
            profit: '430 000',
        },
        editableFields: ['totalIncome', 'totalExpense', 'profit'],
        isBuiltIn: true,
        enabled: true,
    },
    'card-kpi': {
        type: 'card-kpi',
        name: 'KPI-карточка',
        category: 'cards',
        defaultWidth: 200,
        defaultHeight: 120,
        defaultProps: {
            kpiLabel: 'Активные клиенты',
            kpiValue: '128',
        },
        editableFields: ['kpiLabel', 'kpiValue'],
        isBuiltIn: true,
        enabled: true,
    },
};

const mergeWithDefaults = (library: Record<string, ComponentDefinition>) => {
    const merged: Record<string, ComponentDefinition> = { ...DEFAULT_LIBRARY };

    Object.values(library).forEach((definition) => {
        const existing = merged[definition.type];
        const isBuiltIn = existing?.isBuiltIn ?? definition.isBuiltIn ?? false;

        merged[definition.type] = {
            ...(existing ?? {}),
            ...definition,
            name: isBuiltIn && existing ? existing.name : (definition.name ?? existing?.name ?? definition.type),
            category: isBuiltIn && existing
                ? existing.category
                : (definition.category ?? existing?.category ?? 'custom'),
            isBuiltIn,
            enabled: definition.enabled ?? existing?.enabled ?? true,
        };
    });

    return merged;
};

export const useComponentStore = create<ComponentStoreState>()(
    persist(
        (set, get) => ({
            library: DEFAULT_LIBRARY,

            registerComponent: (def) => set((state) => ({
                library: mergeWithDefaults({
                    ...state.library,
                    [def.type]: {
                        ...def,
                        category: def.category || 'custom',
                        isBuiltIn: false,
                        enabled: def.enabled ?? true,
                    },
                }),
            })),

            updateComponent: (type, updates) => set((state) => {
                const current = state.library[type];
                if (!current) {
                    return state;
                }

                return {
                    library: {
                        ...state.library,
                        [type]: {
                            ...current,
                            ...updates,
                            type,
                        },
                    },
                };
            }),

            removeComponent: (type) => set((state) => {
                const current = state.library[type];
                if (!current || current.isBuiltIn) {
                    return state;
                }

                const nextLibrary = { ...state.library };
                delete nextLibrary[type];
                return { library: mergeWithDefaults(nextLibrary) };
            }),

            setComponentEnabled: (type, enabled) => set((state) => {
                const current = state.library[type];
                if (!current) {
                    return state;
                }

                return {
                    library: {
                        ...state.library,
                        [type]: {
                            ...current,
                            enabled,
                        },
                    },
                };
            }),

            getComponentDefinition: (type) => get().library[type],

            getAllComponents: () => Object.values(get().library),

            getActiveComponents: () => Object.values(get().library).filter((item) => item.enabled !== false),
        }),
        {
            name: 'builder_crm_component_library',
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<ComponentStoreState> | undefined;
                return {
                    ...currentState,
                    library: mergeWithDefaults(persisted?.library ?? currentState.library),
                };
            },
        }
    )
);

export type ComponentType = string;
