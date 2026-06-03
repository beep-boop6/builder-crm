import React, { useEffect, useMemo } from 'react';
import { useDataStore } from '../../../store/dataStore';
import { applyChartMapping } from '@/utils/dataMapping';
import { validateChartMapping } from '@/utils/dataValidation';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
import { useEditorStore } from '@/store/editorStore';
import type { ChartFieldMapping, ComponentDataProps } from '@/types/data';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { chartBackgroundPlugin } from './chartBackgroundPlugin';
import styles from './ChartWidget.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
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

export const ChartWidget: React.FC<ChartWidgetProps> = ({ componentId, props, fillColor }) => {
    const { sources, loadData } = useDataStore();
    const canvasComponents = useEditorStore((state) => state.components);

    const dataSourceId = props.dataSourceId;
    const source = sources.find((item) => item.id === dataSourceId);
    const isConfigured = Boolean(dataSourceId && dataSourceId !== 'none');

    useEffect(() => {
        if (isConfigured && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId!);
        }
    }, [isConfigured, dataSourceId, source, loadData]);

    const chartMapping = (props.chartMapping as ChartFieldMapping | undefined) ?? {
        xField: (props.xAxisKey as string) ?? '',
        yField: (props.yAxisKey as string) ?? '',
    };

    const chartState = useMemo(() => {
        if (!isConfigured || !source?.data?.length) {
            const fallback = applyChartMapping(DEFAULT_DATA, undefined, { xField: 'name', yField: 'value' });
            return {
                labels: fallback.labels,
                values: fallback.values,
                validationError: null as string | null,
            };
        }

        const filteredRows = applyFiltersToRows(
            source.data,
            collectFiltersForTarget(canvasComponents, componentId)
        );

        const validation = validateChartMapping(filteredRows, chartMapping);
        if (!validation.valid) {
            return {
                labels: [],
                values: [],
                validationError: validation.error ?? 'Ошибка маппинга',
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
        };
    }, [canvasComponents, chartMapping, componentId, isConfigured, props.xAxisKey, props.yAxisKey, source?.data]);

    const chartType = (props.chartType as string) || 'bar';
    const seriesColor = normalizeHex(
        (props.style as { color?: string } | undefined)?.color
            ?? (props.color as string | undefined),
        '#1976d2'
    );
    const backgroundColor = normalizeHex(
        fillColor
            ?? (props.backgroundColor as string | undefined)
            ?? (props.style as { backgroundColor?: string } | undefined)?.backgroundColor,
        '#FFFFFF'
    );

    const chartData = useMemo(() => ({
        labels: chartState.labels,
        datasets: [
            {
                label: chartMapping.yField || 'Значение',
                data: chartState.values,
                backgroundColor: chartType === 'bar' ? seriesColor : 'transparent',
                borderColor: seriesColor,
                borderWidth: chartType === 'line' ? 3 : 1,
                borderRadius: chartType === 'bar' ? 4 : 0,
                pointBackgroundColor: seriesColor,
                pointBorderColor: seriesColor,
                pointRadius: 4,
                tension: 0.3,
            },
        ],
    }), [chartState.labels, chartState.values, chartMapping.yField, chartType, seriesColor]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            customCanvasBackgroundColor: {
                color: backgroundColor,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#e8e8e8' },
            },
            x: {
                grid: { display: false },
            },
        },
    }), [backgroundColor]);

    return (
        <div
            id={componentId}
            className={styles.chartContainer}
            style={{ backgroundColor }}
        >
            {(!isConfigured || source?.isLoading || source?.error || chartState.validationError) && (
                <div className={styles.overlay} style={{ backgroundColor: `${backgroundColor}d9` }}>
                    {!isConfigured && <span className={styles.overlayText}>Выберите данные</span>}
                    {source?.isLoading && <span className={styles.overlayText}>Загрузка...</span>}
                    {source?.error && <span className={styles.overlayTextError}>{source.error}</span>}
                    {chartState.validationError && (
                        <span className={styles.overlayTextWarning}>{chartState.validationError}</span>
                    )}
                </div>
            )}

            <div className={styles.chartInner} style={{ backgroundColor }}>
                {chartType === 'line' ? (
                    <Line key={`${backgroundColor}-${seriesColor}-${chartType}`} data={chartData} options={chartOptions} />
                ) : (
                    <Bar key={`${backgroundColor}-${seriesColor}-${chartType}`} data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
};
