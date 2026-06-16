import React, { useEffect, useMemo } from 'react';
import { useDataStore } from '../../../store/dataStore';
import { applyChartMapping } from '@/utils/dataMapping';
import { validateChartMapping } from '@/utils/dataValidation';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
import { resolveChartRowsFromTable } from '@/utils/chartTableData';
import { useEditorStore } from '@/store/editorStore';
import type { ChartFieldMapping, ComponentDataProps } from '@/types/data';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { chartBackgroundPlugin } from './chartBackgroundPlugin';
import styles from './ChartWidget.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    chartBackgroundPlugin
);

interface ChartWidgetProps {
    componentId: string;
    props: ComponentDataProps & Record<string, unknown>;
    /** Фон области графика (из props или поля компонента) */
    fillColor?: string;
}

const DEFAULT_DATA = [
    { name: 'Янв', value: 400 },
    { name: 'Фев', value: 300 },
    { name: 'Мар', value: 550 },
    { name: 'Апр', value: 200 },
];

const normalizeHex = (value: string | undefined, fallback: string): string => {
    if (!value) {
        return fallback;
    }
    const trimmed = value.trim();
    if (trimmed.startsWith('#')) {
        return trimmed.length === 7 ? trimmed : fallback;
    }
    if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return `#${trimmed}`;
    }
    return fallback;
};

const PIE_SLICE_PALETTE = [
    '#155DA4',
    '#1a6bb8',
    '#42a5f5',
    '#64b5f6',
    '#5c6bc0',
    '#7e57c2',
    '#ab47bc',
    '#26a69a',
];

const getPieSliceColors = (baseColor: string, count: number): string[] => {
    const palette = [baseColor, ...PIE_SLICE_PALETTE.filter((color) => color !== baseColor)];
    return Array.from({ length: count }, (_, index) => palette[index % palette.length]);
};

export const ChartWidget: React.FC<ChartWidgetProps> = ({ componentId, props, fillColor }) => {
    const { sources, loadData } = useDataStore();
    const canvasComponents = useEditorStore((state) => state.components);

    const tableComponentId = props.tableComponentId as string | undefined;
    const dataSourceId = props.dataSourceId;
    const linkedTable = useMemo(
        () => canvasComponents.find((item) => item.id === tableComponentId && item.type === 'table'),
        [canvasComponents, tableComponentId]
    );
    const linkedTableDataSourceId = linkedTable?.props?.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === (linkedTableDataSourceId ?? dataSourceId));
    const isTableMode = Boolean(tableComponentId && linkedTable);
    const isLegacySourceMode = Boolean(!isTableMode && dataSourceId && dataSourceId !== 'none');
    const isConfigured = isTableMode || isLegacySourceMode;

    useEffect(() => {
        canvasComponents.forEach((item) => {
            if (item.type !== 'table') {
                return;
            }
            const itemSourceId = item.props?.dataSourceId as string | undefined;
            if (!itemSourceId || itemSourceId === 'none') {
                return;
            }
            const itemSource = sources.find((entry) => entry.id === itemSourceId);
            if (itemSource && !itemSource.data && !itemSource.isLoading && !itemSource.error) {
                loadData(itemSourceId);
            }
        });

        if (
            isLegacySourceMode
            && dataSourceId
            && source
            && !source.data
            && !source.isLoading
            && !source.error
        ) {
            loadData(dataSourceId);
        }
    }, [canvasComponents, dataSourceId, isLegacySourceMode, loadData, source]);

    const chartMapping = (props.chartMapping as ChartFieldMapping | undefined) ?? {
        xField: (props.xAxisKey as string) ?? '',
        yField: (props.yAxisKey as string) ?? '',
    };

    const chartState = useMemo(() => {
        if (!isConfigured) {
            const fallback = applyChartMapping(DEFAULT_DATA, undefined, { xField: 'name', yField: 'value' });
            return {
                labels: fallback.labels,
                values: fallback.values,
                validationError: null as string | null,
                isLoading: false,
                loadError: null as string | null,
            };
        }

        const tableSourceData = linkedTableDataSourceId
            ? sources.find((item) => item.id === linkedTableDataSourceId)?.data
            : undefined;

        const filteredRows = isTableMode && tableComponentId
            ? resolveChartRowsFromTable(
                canvasComponents,
                tableComponentId,
                componentId,
                tableSourceData
            )
            : source?.data
                ? applyFiltersToRows(
                    source.data,
                    collectFiltersForTarget(canvasComponents, componentId)
                )
                : [];

        if (isTableMode && linkedTableDataSourceId && source?.isLoading && filteredRows.length === 0) {
            return {
                labels: [],
                values: [],
                validationError: null,
                isLoading: true,
                loadError: null,
            };
        }

        if (source?.error) {
            return {
                labels: [],
                values: [],
                validationError: null,
                isLoading: false,
                loadError: source.error,
            };
        }

        if (filteredRows.length === 0) {
            return {
                labels: [],
                values: [],
                validationError: isConfigured && chartMapping.xField && chartMapping.yField
                    ? 'Нет данных для построения графика'
                    : 'Выберите колонки для осей X и Y',
                isLoading: false,
                loadError: null,
            };
        }

        const validation = validateChartMapping(filteredRows, chartMapping);
        if (!validation.valid) {
            return {
                labels: [],
                values: [],
                validationError: validation.error ?? 'Ошибка настройки данных графика',
                isLoading: false,
                loadError: null,
            };
        }

        const mapped = applyChartMapping(filteredRows, chartMapping, {
            xField: props.xAxisKey as string | undefined,
            yField: props.yAxisKey as string | undefined,
        });

        return {
            labels: mapped.labels,
            values: mapped.values,
            validationError: null as string | null,
            isLoading: false,
            loadError: null,
        };
    }, [
        canvasComponents,
        chartMapping,
        componentId,
        isConfigured,
        isTableMode,
        linkedTableDataSourceId,
        props.xAxisKey,
        props.yAxisKey,
        source?.data,
        source?.error,
        source?.isLoading,
        tableComponentId,
    ]);

    const chartType = (props.chartType as string) || 'bar';
    const seriesColor = normalizeHex(
        (props.style as { color?: string } | undefined)?.color
            ?? (props.color as string | undefined),
        '#E8E8E8'
    );
    const backgroundColor = normalizeHex(
        fillColor
            ?? (props.backgroundColor as string | undefined)
            ?? (props.style as { backgroundColor?: string } | undefined)?.backgroundColor,
        '#FFFFFF'
    );

    const chartData = useMemo(() => {
        const sliceCount = chartState.values.length;
        const pieColors = getPieSliceColors(seriesColor, sliceCount);

        return {
            labels: chartState.labels,
            datasets: [
                {
                    label: chartMapping.yField || 'Значение',
                    data: chartState.values,
                    backgroundColor: chartType === 'pie'
                        ? pieColors
                        : chartType === 'bar'
                            ? seriesColor
                            : 'transparent',
                    borderColor: chartType === 'pie' ? '#FFFFFF' : seriesColor,
                    borderWidth: chartType === 'pie' ? 2 : chartType === 'line' ? 3 : 1,
                    borderRadius: chartType === 'bar' ? 4 : 0,
                    pointBackgroundColor: seriesColor,
                    pointBorderColor: seriesColor,
                    pointRadius: 4,
                    tension: 0.3,
                },
            ],
        };
    }, [chartState.labels, chartState.values, chartMapping.yField, chartType, seriesColor]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: chartType === 'pie' ? ('right' as const) : ('top' as const),
            },
            customCanvasBackgroundColor: {
                color: backgroundColor,
            },
        },
        ...(chartType === 'pie'
            ? {}
            : {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e8e8e8' },
                    },
                    x: {
                        grid: { display: false },
                    },
                },
            }),
    }), [backgroundColor, chartType]);

    const showOverlay = !isConfigured
        || chartState.isLoading
        || chartState.loadError
        || chartState.validationError;

    return (
        <div
            id={componentId}
            className={styles.chartContainer}
            style={{ backgroundColor }}
        >
            {showOverlay && (
                <div className={styles.overlay} style={{ backgroundColor: `${backgroundColor}d9` }}>
                    {!isConfigured && <span className={styles.overlayText}>Выберите таблицу</span>}
                    {chartState.isLoading && <span className={styles.overlayText}>Загрузка...</span>}
                    {chartState.loadError && <span className={styles.overlayTextError}>{chartState.loadError}</span>}
                    {chartState.validationError && (
                        <span className={styles.overlayTextWarning}>{chartState.validationError}</span>
                    )}
                </div>
            )}

            <div className={styles.chartInner} style={{ backgroundColor }}>
                {chartType === 'line' ? (
                    <Line key={`${backgroundColor}-${seriesColor}-${chartType}`} data={chartData} options={chartOptions} />
                ) : chartType === 'pie' ? (
                    <Pie key={`${backgroundColor}-${seriesColor}-${chartType}`} data={chartData} options={chartOptions} />
                ) : (
                    <Bar key={`${backgroundColor}-${seriesColor}-${chartType}`} data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
};
