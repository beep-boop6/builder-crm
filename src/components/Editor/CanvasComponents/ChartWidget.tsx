import React, { useEffect } from 'react';
import { useDataStore } from '../../../store/dataStore';
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
import styles from './ChartWidget.module.css';

// Регистрируем нужные модули Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ChartWidgetProps {
    componentId: string;
    props: any;
}

const DEFAULT_DATA = [
    { name: 'Янв', value: 400 },
    { name: 'Фев', value: 300 },
    { name: 'Мар', value: 550 },
    { name: 'Апр', value: 200 }
];

export const ChartWidget: React.FC<ChartWidgetProps> = ({ componentId, props }) => {
    const { sources, loadData } = useDataStore();

    const dataSourceId = props.dataSourceId;
    const source = sources.find(s => s.id === dataSourceId);

    const isConfigured = dataSourceId && dataSourceId !== 'none';
    const isLoading = source?.isLoading;
    const hasError = !!source?.error;

    useEffect(() => {
        if (isConfigured && source && !source.data && !isLoading) {
            loadData(dataSourceId);
        }
    }, [isConfigured, dataSourceId, source, isLoading, loadData]);

    const hasRealData = isConfigured && source?.data && source.data.length > 0;
    const data = hasRealData ? source.data : DEFAULT_DATA;

    const chartType = props.chartType || 'bar';
    const xAxisKey = props.xAxisKey || (hasRealData ? Object.keys(data[0])[0] : 'name');
    const yAxisKey = props.yAxisKey || (hasRealData ? Object.keys(data[0])[1] : 'value');
    const color = props.style?.color || '#1976d2';

    // Подготавливаем данные в формате, понятном для Chart.js
    const chartData = {
        labels: data.map((item: any) => item[xAxisKey]),
        datasets: [
            {
                label: yAxisKey || 'Значение',
                data: data.map((item: any) => item[yAxisKey]),
                backgroundColor: chartType === 'bar' ? color : 'transparent',
                borderColor: color,
                borderWidth: chartType === 'line' ? 3 : 1,
                borderRadius: chartType === 'bar' ? 4 : 0, // Скругление столбцов
                pointBackgroundColor: color,
                pointRadius: 4,
                tension: 0.3, // Плавность линии
            },
        ],
    };

    // Настройки отображения графика
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Отключаем жесткие пропорции, чтобы график тянулся за рамкой
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#eee' }
            },
            x: {
                grid: { display: false }
            }
        },
    };

    return (
        <div id={componentId} className={styles.chartContainer}>

            {/* Оверлей состояний */}
            {(!isConfigured || isLoading || hasError) && (
                <div className={styles.overlay}>
                    {!isConfigured && <span style={{ color: '#555', fontSize: '14px', fontWeight: 500 }}>Выберите данные</span>}
                    {isLoading && <span style={{ color: '#1976d2', fontSize: '14px', fontWeight: 500 }}>Загрузка...</span>}
                    {hasError && <span style={{ color: 'red', fontSize: '14px', fontWeight: 500 }}>Ошибка</span>}
                </div>
            )}

            {/* Сам график */}
            <div className={styles.chartInner} style={{ padding: '10px', boxSizing: 'border-box' }}>
                {chartType === 'line' ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <Bar data={chartData} options={chartOptions} />
                )}
            </div>

        </div>
    );
};