import React, { useEffect } from 'react';
import { useDataStore } from '../../../store/dataStore';
import styles from './ChartWidget.module.css';

interface ChartWidgetProps {
  componentId: string;
  props: any;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ props }) => {
  const { sources, loadData } = useDataStore();

  const dataSourceId = props.dataSourceId;
  const source = sources.find(s => s.id === dataSourceId);

  useEffect(() => {
    if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading) {
      loadData(dataSourceId);
    }
  }, [dataSourceId, source, loadData]);

  if (!dataSourceId || dataSourceId === 'none') {
    return (
      <div className={styles.emptyChart} style={props.style}>
        Выберите источник данных для графика
      </div>
    );
  }

  if (source?.isLoading) return <div className={styles.emptyChart}>Загрузка данных...</div>;
  if (source?.error) return <div className={styles.emptyChart} style={{ color: 'red' }}>Ошибка: {source.error}</div>;

  const data = source?.data || [];

  // Настройки графика из props
  const chartType = props.chartType || 'bar'; // 'bar' или 'line'
  // xAxisKey используется для будущего расширения (отображение подписи оси X)
  const yAxisKey = props.yAxisKey || (data.length > 0 ? Object.keys(data[0])[1] : '');
  const color = props.style?.color || '#1976d2';

  // Базовые стили для обертки (тянется на 100%)
  const appliedStyles = {
    ...props.style,
    width: props.style?.width || '100%',
    height: props.style?.height || '100%',
  };

  // Простой SVG-график как fallback (без recharts)
  const renderSimpleChart = () => {
    if (data.length === 0) return <div className={styles.emptyChart}>Нет данных для отображения</div>;

    const values = data.map((d: any) => Number(d[yAxisKey]) || 0);
    const maxValue = Math.max(...values, 1);
    const barWidth = 100 / data.length;

    if (chartType === 'line') {
      const points = values.map((v: number, i: number) => {
        const x = (i + 0.5) * barWidth;
        const y = 100 - (v / maxValue) * 80;
        return `${x},${y}`;
      }).join(' ');

      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {values.map((v: number, i: number) => (
            <circle key={i} cx={(i + 0.5) * barWidth} cy={100 - (v / maxValue) * 80} r="2" fill={color} />
          ))}
        </svg>
      );
    }

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {values.map((v: number, i: number) => (
          <rect
            key={i}
            x={i * barWidth + 1}
            y={100 - (v / maxValue) * 80}
            width={barWidth - 2}
            height={(v / maxValue) * 80}
            fill={color}
            rx="2"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className={styles.chartWrapper} style={appliedStyles}>
      {renderSimpleChart()}
    </div>
  );
};