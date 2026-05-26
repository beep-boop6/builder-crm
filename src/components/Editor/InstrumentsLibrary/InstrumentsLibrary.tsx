import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import styles from './InstrumentsLibrary.module.css';

interface Props {
    isOpen: boolean;
}

// Все доступные компоненты
const AVAILABLE_COMPONENTS = [
    { type: 'button', label: 'Кнопка' },
    { type: 'table', label: 'Таблица' },
    { type: 'chart', label: 'График' },
    { type: 'form', label: 'Форма' },
    { type: 'card', label: 'Карточка' },
    { type: 'filter', label: 'Фильтр' },
];

export const InstrumentsLibrary = ({ isOpen }: Props) => {
    const [isDragging, setIsDragging] = useState(false);
    const recentComponentTypes = useEditorStore((state) => state.recentComponents);

    if (!isOpen) return null;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
        e.dataTransfer.setData('componentType', type);
        e.dataTransfer.effectAllowed = 'copy';
        // Асинхронно меняем стейт, чтобы иконка, которую тащит пользователь, не стала полупрозрачной
        setTimeout(() => setIsDragging(true), 0);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const renderIcon = (type: string) => {
        if (type === 'button') return <div className={styles.mockButton}>Btn</div>;
        if (type === 'table') return (
            <div className={styles.mockTable}>
                {[...Array(9)].map((_, i) => <div key={i} className={styles.mockTableCell} />)}
            </div>
        );
        if (type === 'chart') return <div className={styles.mockChart}>📊</div>;
        if (type === 'form') return <div className={styles.mockForm}>📝</div>;
        if (type === 'card') return <div className={styles.mockCard}>🗂️</div>;
        if (type === 'filter') return <div className={styles.mockFilter}>🔍</div>;
        return null;
    };

    // Получаем реальные объекты компонентов на основе сохраненных типов
    const recentItems = recentComponentTypes
        .map(type => AVAILABLE_COMPONENTS.find(c => c.type === type))
        .filter(Boolean);

    return (
        <div 
            className={styles.libraryPanel}
            style={{ opacity: isDragging ? 0.3 : 1 }}
        >
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Инструменты</h2>
                <svg className={styles.searchIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Недавно использованные</div>
                <div className={styles.grid}>
                    {recentItems.length > 0 ? (
                        recentItems.map((item) => (
                            <div key={`recent-${item!.type}`} className={styles.itemWrapper}>
                                <div 
                                    className={styles.componentBox}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item!.type)}
                                    onDragEnd={handleDragEnd}
                                >
                                    {renderIcon(item!.type)}
                                </div>
                                <span className={styles.itemLabel}>{item!.label}</span>
                            </div>
                        ))
                    ) : (
                        <span className={styles.emptyRecent}>Нет недавних</span>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Компоненты</div>
                <div className={styles.grid}>
                    {AVAILABLE_COMPONENTS.map((comp) => (
                        <div key={`all-${comp.type}`} className={styles.itemWrapper}>
                            <div 
                                className={styles.componentBox}
                                draggable
                                onDragStart={(e) => handleDragStart(e, comp.type)}
                                onDragEnd={handleDragEnd}
                            >
                                {renderIcon(comp.type)}
                            </div>
                            <span className={styles.itemLabel}>{comp.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};