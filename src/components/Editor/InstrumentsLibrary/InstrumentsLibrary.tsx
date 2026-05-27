import React, { useMemo, useState } from 'react';
import { Input } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import styles from './InstrumentsLibrary.module.css';

interface Props {
    isOpen: boolean;
}

export const InstrumentsLibrary = ({ isOpen }: Props) => {
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const recentComponentTypes = useEditorStore((state) => state.recentComponents);
    const getActiveComponents = useComponentStore((state) => state.getActiveComponents);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);

    const availableComponents = getActiveComponents();

    const filteredComponents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return availableComponents;
        }

        return availableComponents.filter((component) =>
            component.name.toLowerCase().includes(query) ||
            component.type.toLowerCase().includes(query)
        );
    }, [availableComponents, searchQuery]);

    if (!isOpen) return null;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
        e.dataTransfer.setData('componentType', type);
        e.dataTransfer.effectAllowed = 'copy';
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
        return <div className={styles.mockCard}>◻</div>;
    };

    const recentItems = recentComponentTypes
        .map((type) => getComponentDefinition(type))
        .filter((component) => component && component.enabled !== false);

    return (
        <div
            className={styles.libraryPanel}
            style={{ opacity: isDragging ? 0.3 : 1 }}
        >
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Инструменты</h2>
                <Input
                    allowClear
                    placeholder="Поиск компонента"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={styles.searchInput}
                />
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
                                <span className={styles.itemLabel}>{item!.name}</span>
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
                    {filteredComponents.length > 0 ? (
                        filteredComponents.map((comp) => (
                            <div key={`all-${comp.type}`} className={styles.itemWrapper}>
                                <div
                                    className={styles.componentBox}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comp.type)}
                                    onDragEnd={handleDragEnd}
                                >
                                    {renderIcon(comp.type)}
                                </div>
                                <span className={styles.itemLabel}>{comp.name}</span>
                            </div>
                        ))
                    ) : (
                        <span className={styles.emptyRecent}>Ничего не найдено</span>
                    )}
                </div>
            </div>
        </div>
    );
};
