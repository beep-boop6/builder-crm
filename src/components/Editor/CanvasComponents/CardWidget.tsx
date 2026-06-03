import React from 'react';
import { Statistic, Typography } from 'antd';
import type { EditorComponent } from '@/store/editorStore';
import { resolveCardVariant } from '@/utils/componentFilters';
import { ContactCardWidget } from './ContactCardWidget';
import styles from './CardWidget.module.css';

const { Text, Title } = Typography;

interface CardWidgetProps {
    component: EditorComponent;
}

const V_ALIGN_MAP: Record<string, React.CSSProperties['justifyContent']> = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
};

export const CardWidget = ({ component }: CardWidgetProps) => {
    const variant = resolveCardVariant(component.type);
    const props = component.props ?? {};

    const textAlign = (props.textAlign as string) || 'left';
    const justifyContent = V_ALIGN_MAP[(props.verticalAlign as string) || 'top'] ?? 'flex-start';

    const cardStyle: React.CSSProperties = {
        backgroundColor: component.backgroundColor || '#fff',
        textAlign: textAlign as React.CSSProperties['textAlign'],
        justifyContent,
    };

    if (variant === 'client') {
        return <ContactCardWidget component={component} />;
    }

    if (variant === 'deal') {
        return (
            <div className={styles.variantCard} style={cardStyle}>
                <Title level={5} className={styles.title}>
                    {String(props.dealTitle ?? 'Сделка')}
                </Title>
                <Text type="secondary">Клиент: {String(props.clientName ?? '—')}</Text>
                <div className={styles.row}>
                    <Text>Статус: {String(props.dealStatus ?? '—')}</Text>
                    <Text strong>{String(props.dealAmount ?? '0')} ₽</Text>
                </div>
            </div>
        );
    }

    if (variant === 'summary') {
        return (
            <div className={styles.variantCard} style={cardStyle}>
                <Title level={5} className={styles.title}>Итоги</Title>
                <div className={styles.statsGrid}>
                    <Statistic title="Доход" value={String(props.totalIncome ?? '0')} suffix="₽" />
                    <Statistic title="Расход" value={String(props.totalExpense ?? '0')} suffix="₽" />
                    <Statistic title="Прибыль" value={String(props.profit ?? '0')} suffix="₽" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.variantCard} style={cardStyle}>
            <Text type="secondary">{String(props.kpiLabel ?? 'Показатель')}</Text>
            <Title level={2} className={styles.kpiValue}>
                {String(props.kpiValue ?? '0')}
            </Title>
        </div>
    );
};
