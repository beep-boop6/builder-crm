import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Input, Popconfirm, Select } from 'antd';
import type { InputRef } from 'antd/es/input';
import searchIcon from '@/assets/icons/search.svg';
import { useEditorStore, type EditorComponent } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { useReusablePresetStore } from '@/store/reusablePresetStore';
import {
    COMPONENT_CATEGORIES,
    getCategoryLabel,
    getComponentTypeLabel,
} from '@/constants/componentCategories';
import {
    buildComponentFromDefinition,
    buildComponentFromSnapshot,
    type ComponentSnapshot,
} from '@/utils/componentDefaults';
import { ComponentLibraryPreview } from './ComponentLibraryPreview';
import { computeLibraryPreviewPosition } from './libraryPreviewPosition';
import styles from './InstrumentsLibrary.module.css';

type HoverPreviewState = {
    component: EditorComponent;
    title: string;
    position: { left: number; top: number };
};

const PREVIEW_SHOW_DELAY_MS = 1000;

interface Props {
    isOpen: boolean;
}

export const InstrumentsLibrary = ({ isOpen }: Props) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [hoverPreview, setHoverPreview] = useState<HoverPreviewState | null>(null);
    const searchInputRef = useRef<InputRef>(null);
    const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPreviewTimeout = () => {
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }
    };

    const recentComponentTypes = useEditorStore((state) => state.recentComponents);
    const getActiveComponents = useComponentStore((state) => state.getActiveComponents);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);
    const presets = useReusablePresetStore((state) => state.presets);
    const deletePreset = useReusablePresetStore((state) => state.deletePreset);

    const availableComponents = getActiveComponents();

    const filteredComponents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return availableComponents.filter((component) => {
            const matchesCategory = categoryFilter === 'all' || component.category === categoryFilter;
            const matchesQuery = !query ||
                component.name.toLowerCase().includes(query) ||
                component.type.toLowerCase().includes(query) ||
                getCategoryLabel(component.category).toLowerCase().includes(query);

            return matchesCategory && matchesQuery;
        });
    }, [availableComponents, categoryFilter, searchQuery]);

    const filteredPresets = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return presets.filter((preset) => {
            const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter;
            const matchesQuery = !query ||
                preset.name.toLowerCase().includes(query) ||
                preset.snapshot.type.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        });
    }, [categoryFilter, presets, searchQuery]);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    useEffect(() => () => clearPreviewTimeout(), []);

    useEffect(() => {
        if (!isOpen) {
            clearPreviewTimeout();
            setHoverPreview(null);
        }
    }, [isOpen]);

    const hideHoverPreview = () => {
        clearPreviewTimeout();
        setHoverPreview(null);
    };

    const showHoverPreview = (
        event: React.MouseEvent<HTMLDivElement>,
        title: string,
        type: string,
        snapshot?: ComponentSnapshot
    ) => {
        clearPreviewTimeout();

        const definition = getComponentDefinition(type);
        const built = snapshot
            ? buildComponentFromSnapshot(snapshot, { x: 0, y: 0 })
            : buildComponentFromDefinition(type, definition, { x: 0, y: 0 });
        const anchorRect = event.currentTarget.getBoundingClientRect();
        const previewData: HoverPreviewState = {
            title,
            component: { id: 'library-preview', ...built },
            position: computeLibraryPreviewPosition(anchorRect),
        };

        previewTimeoutRef.current = setTimeout(() => {
            previewTimeoutRef.current = null;
            setHoverPreview(previewData);
        }, PREVIEW_SHOW_DELAY_MS);
    };

    const handleSearchToggle = () => {
        setIsSearchOpen((open) => {
            if (open) {
                setSearchQuery('');
            }
            return !open;
        });
    };

    if (!isOpen) return null;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
        e.dataTransfer.setData('componentType', type);
        e.dataTransfer.effectAllowed = 'copy';
        hideHoverPreview();
        setTimeout(() => setIsDragging(true), 0);
    };

    const handlePresetDragStart = (e: React.DragEvent<HTMLDivElement>, presetId: string) => {
        e.dataTransfer.setData('componentPresetId', presetId);
        e.dataTransfer.effectAllowed = 'copy';
        hideHoverPreview();
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
        if (type === 'filter') return <div className={styles.mockFilter}>🔍</div>;
        if (type === 'card' || type === 'card-client') return <div className={styles.mockCard}>👤</div>;
        if (type === 'card-deal') return <div className={styles.mockCard}>💼</div>;
        if (type === 'card-summary') return <div className={styles.mockCard}>📊</div>;
        if (type === 'card-kpi') return <div className={styles.mockCard}>📈</div>;
        return <div className={styles.mockCard}>◻</div>;
    };

    const cardComponents = filteredComponents.filter((component) => component.category === 'cards');
    const mainComponents = filteredComponents.filter((component) => component.category !== 'cards');

    const recentItems = recentComponentTypes
        .map((type) => getComponentDefinition(type))
        .filter((component) => component && component.enabled !== false);

    return (
        <div className={styles.libraryWrapper}>
            <div
                className={styles.libraryPanel}
                style={{ opacity: isDragging ? 0.3 : 1 }}
            >
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h2 className={styles.headerTitle}>Инструменты</h2>
                    <button
                        type="button"
                        className={styles.searchToggle}
                        onClick={handleSearchToggle}
                        aria-label={isSearchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
                        aria-expanded={isSearchOpen}
                    >
                        <img src={searchIcon} alt="" className={styles.searchIconImage} />
                    </button>
                </div>
                {isSearchOpen ? (
                    <Input
                        ref={searchInputRef}
                        allowClear
                        placeholder="Поиск по названию или типу"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onClear={() => setSearchQuery('')}
                        className={styles.searchInput}
                    />
                ) : null}
                <Select
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    className={styles.categorySelect}
                    options={COMPONENT_CATEGORIES.map((category) => ({
                        value: category.id,
                        label: category.label,
                    }))}
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
                                    onMouseEnter={(e) => showHoverPreview(e, item!.name, item!.type)}
                                    onMouseLeave={hideHoverPreview}
                                >
                                    {renderIcon(item!.type)}
                                </div>
                                <span className={styles.itemLabel}>{item!.name}</span>
                            </div>
                        ))
                    ) : (
                        <span className={styles.emptyRecent}>Пусто</span>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Мои шаблоны</div>
                <div className={styles.grid}>
                    {filteredPresets.length > 0 ? (
                        filteredPresets.map((preset) => (
                            <div key={`preset-${preset.id}`} className={styles.itemWrapper}>
                                <div className={styles.presetItem}>
                                    <div
                                        className={`${styles.componentBox} ${styles.presetBox}`}
                                        draggable
                                        onDragStart={(e) => handlePresetDragStart(e, preset.id)}
                                        onDragEnd={handleDragEnd}
                                        onMouseEnter={(e) =>
                                            showHoverPreview(e, preset.name, preset.snapshot.type, preset.snapshot)
                                        }
                                        onMouseLeave={hideHoverPreview}
                                        title={preset.name}
                                    >
                                        {renderIcon(preset.snapshot.type)}
                                    </div>
                                    <Popconfirm
                                        title="Удалить шаблон?"
                                        description={`«${preset.name}» будет удалён из библиотеки.`}
                                        okText="Удалить"
                                        cancelText="Отмена"
                                        onConfirm={() => deletePreset(preset.id)}
                                    >
                                        <button
                                            type="button"
                                            className={styles.deletePresetBtn}
                                            onClick={(event) => event.stopPropagation()}
                                            title="Удалить шаблон"
                                        >
                                            ×
                                        </button>
                                    </Popconfirm>
                                </div>
                                <span className={styles.itemLabel}>{preset.name}</span>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyPresets}>Пусто</div>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Карточки</div>
                <div className={styles.grid}>
                    {cardComponents.length > 0 ? (
                        cardComponents.map((comp) => (
                            <div key={`card-${comp.type}`} className={styles.itemWrapper}>
                                <div
                                    className={styles.componentBox}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comp.type)}
                                    onDragEnd={handleDragEnd}
                                    onMouseEnter={(e) => showHoverPreview(e, comp.name, comp.type)}
                                    onMouseLeave={hideHoverPreview}
                                >
                                    {renderIcon(comp.type)}
                                </div>
                                <div className={styles.itemTexts}>
                                    <span className={styles.itemLabel}>{comp.name}</span>
                                    <span className={styles.itemCategory}>{getComponentTypeLabel(comp.type)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <span className={styles.emptyRecent}>Нет карточек</span>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Компоненты</div>
                <div className={styles.grid}>
                    {mainComponents.length > 0 ? (
                        mainComponents.map((comp) => (
                            <div key={`all-${comp.type}`} className={styles.itemWrapper}>
                                <div
                                    className={styles.componentBox}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comp.type)}
                                    onDragEnd={handleDragEnd}
                                    onMouseEnter={(e) => showHoverPreview(e, comp.name, comp.type)}
                                    onMouseLeave={hideHoverPreview}
                                >
                                    {renderIcon(comp.type)}
                                </div>
                                <div className={styles.itemTexts}>
                                    <span className={styles.itemLabel}>{comp.name}</span>
                                    <span className={styles.itemCategory}>{getCategoryLabel(comp.category)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <span className={styles.emptyRecent}>Ничего не найдено</span>
                    )}
                </div>
            </div>
            </div>
            {hoverPreview
                ? createPortal(
                    <div
                        className={styles.previewPortal}
                        style={{
                            left: hoverPreview.position.left,
                            top: hoverPreview.position.top,
                        }}
                    >
                        <ComponentLibraryPreview
                            title={hoverPreview.title}
                            component={hoverPreview.component}
                        />
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
};
