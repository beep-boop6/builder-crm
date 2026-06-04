import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dataService } from '../services/dataService';
import { getAvailableFields } from '@/utils/dataMapping';
import { validateDataPayload } from '@/utils/dataValidation';
import type { DataRow } from '@/utils/dataValidation';
import type { DataSourceConfig, DataSourceType } from '@/types/data';
import { getErrorMessage } from '@/utils/getErrorMessage';

export interface DataSource extends DataSourceConfig {
    data: DataRow[] | null;
    fields: string[];
    isLoading: boolean;
    error: string | null;
    lastLoadedAt?: number;
}

interface DataState {
    sources: DataSource[];
    addSource: (source: DataSourceConfig) => void;
    removeSource: (id: string) => void;
    updateSource: (id: string, updates: Partial<DataSourceConfig>) => void;
    loadData: (sourceId: string) => Promise<void>;
    loadAllSources: () => Promise<void>;
    getSourceById: (sourceId: string) => DataSource | undefined;
    getDataById: (sourceId: string) => DataRow[] | null;
    getFieldsById: (sourceId: string) => string[];
}

const DEFAULT_SOURCES: DataSource[] = [
    {
        id: 'src-users',
        name: 'Список пользователей',
        type: 'mock',
        endpoint: 'users',
        data: null,
        fields: [],
        isLoading: false,
        error: null,
    },
    {
        id: 'src-sales',
        name: 'Продажи по месяцам',
        type: 'mock',
        endpoint: 'sales',
        data: null,
        fields: [],
        isLoading: false,
        error: null,
    },
    {
        id: 'src-deals',
        name: 'Сделки (CRM)',
        type: 'mock',
        endpoint: 'deals',
        data: null,
        fields: [],
        isLoading: false,
        error: null,
    },
    {
        id: 'src-clients',
        name: 'Клиенты (CRM)',
        type: 'mock',
        endpoint: 'clients',
        data: null,
        fields: [],
        isLoading: false,
        error: null,
    },
    {
        id: 'src-transactions',
        name: 'Транзакции',
        type: 'mock',
        endpoint: 'transactions',
        data: null,
        fields: [],
        isLoading: false,
        error: null,
    },
];

export const useDataStore = create<DataState>()(
    persist(
        (set, get) => ({
            sources: DEFAULT_SOURCES,

            addSource: (source) => set((state) => ({
                sources: [
                    ...state.sources,
                    {
                        ...source,
                        data: null,
                        fields: [],
                        isLoading: false,
                        error: null,
                    },
                ],
            })),

            removeSource: (id) => set((state) => ({
                sources: state.sources.filter((source) => source.id !== id),
            })),

            updateSource: (id, updates) => set((state) => ({
                sources: state.sources.map((source) =>
                    source.id === id
                        ? {
                            ...source,
                            ...updates,
                            data: null,
                            fields: [],
                            error: null,
                        }
                        : source
                ),
            })),

            loadData: async (sourceId) => {
                const source = get().sources.find((item) => item.id === sourceId);
                if (!source) {
                    return;
                }

                set((state) => ({
                    sources: state.sources.map((item) =>
                        item.id === sourceId
                            ? { ...item, isLoading: true, error: null }
                            : item
                    ),
                }));

                try {
                    const rows = await dataService.fetchByType(source.type, source.endpoint);
                    const validated = validateDataPayload(rows);
                    if (!validated.success) {
                        throw new Error(validated.error);
                    }

                    const fields = getAvailableFields(validated.rows);

                    set((state) => ({
                        sources: state.sources.map((item) =>
                            item.id === sourceId
                                ? {
                                    ...item,
                                    data: validated.rows,
                                    fields,
                                    isLoading: false,
                                    error: null,
                                    lastLoadedAt: Date.now(),
                                }
                                : item
                        ),
                    }));
                } catch (error) {
                    set((state) => ({
                        sources: state.sources.map((item) =>
                            item.id === sourceId
                                ? {
                                    ...item,
                                    isLoading: false,
                                    error: getErrorMessage(error, 'Ошибка загрузки данных'),
                                    data: null,
                                    fields: [],
                                }
                                : item
                        ),
                    }));
                }
            },

            loadAllSources: async () => {
                const { sources, loadData } = get();
                await Promise.all(sources.map((source) => loadData(source.id)));
            },

            getSourceById: (sourceId) => get().sources.find((source) => source.id === sourceId),

            getDataById: (sourceId) => {
                const source = get().sources.find((item) => item.id === sourceId);
                return source?.data ?? null;
            },

            getFieldsById: (sourceId) => {
                const source = get().sources.find((item) => item.id === sourceId);
                return source?.fields ?? [];
            },
        }),
        {
            name: 'builder_crm_data_sources',
            partialize: (state) => ({
                sources: state.sources.map(({ data: _data, isLoading: _loading, error: _error, fields: _fields, lastLoadedAt: _lastLoadedAt, ...config }) => config),
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as { sources?: DataSourceConfig[] } | undefined;
                const savedConfigs = persisted?.sources ?? [];

                const mergedConfigs = savedConfigs.length > 0 ? savedConfigs : DEFAULT_SOURCES.map(({ data: _d, fields: _f, isLoading: _l, error: _e, ...config }) => config);

                return {
                    ...currentState,
                    sources: mergedConfigs.map((config) => ({
                        ...config,
                        data: null,
                        fields: [],
                        isLoading: false,
                        error: null,
                    })),
                };
            },
        }
    )
);

export type { DataSourceType };
