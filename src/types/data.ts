export type DataSourceType = 'mock' | 'rest';

export interface TableColumnMapping {
    sourceField: string;
    title: string;
}

export interface ChartFieldMapping {
    xField: string;
    yField: string;
}

export interface DataSourceConfig {
    id: string;
    name: string;
    type: DataSourceType;
    endpoint: string;
}

export interface ComponentDataProps {
    dataSourceId?: string;
    columnMappings?: TableColumnMapping[];
    chartMapping?: ChartFieldMapping;
    customData?: Record<string, unknown>[];
    customColumns?: Array<{ id: string; title: string }>;
    chartType?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    dataValidationError?: string | null;
}
