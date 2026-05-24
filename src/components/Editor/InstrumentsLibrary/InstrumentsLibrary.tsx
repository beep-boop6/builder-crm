import React, { useState } from 'react';
import styles from './InstrumentsLibrary.module.css';

interface Props {
    isOpen: boolean;
}

const RECENT_COMPONENTS = [
    { type: 'button', label: 'Кнопка' },
    { type: 'table', label: 'Таблица' },
    { type: 'placeholder', label: 'Название' },
];

const ALL_COMPONENTS = [
    { type: 'placeholder', label: 'Название' },
    { type: 'placeholder', label: 'Название' },
    { type: 'placeholder', label: 'Название' },
    { type: 'placeholder', label: 'Название' },
    { type: 'placeholder', label: 'Название' },
    { type: 'placeholder', label: 'Название' },
];

export const InstrumentsLibrary = ({ isOpen }: Props) => {
    const [isDragging, setIsDragging] = useState(false);

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
        return null;
    };

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
                    {RECENT_COMPONENTS.map((comp, idx) => (
                        <div key={`recent-${idx}`} className={styles.itemWrapper}>
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

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Компонент</div>
                <div className={styles.grid}>
                    {ALL_COMPONENTS.map((comp, idx) => (
                        <div key={`all-${idx}`} className={styles.itemWrapper}>
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