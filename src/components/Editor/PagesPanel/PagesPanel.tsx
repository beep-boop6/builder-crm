import { useEffect, useMemo, useState } from 'react';
import { Popconfirm } from 'antd';
import arrowIcon from '@/assets/icons/arrow.svg';
import crossIcon from '@/assets/icons/cross.svg';
import pencilActiveIcon from '@/assets/icons/pencil-line_a.svg';
import pencilInactiveIcon from '@/assets/icons/pencil-line_na.svg';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { buildPageComponentLabels } from '@/utils/pageComponentLabels';
import styles from './PagesPanel.module.css';

interface Props {
    isOpen: boolean;
}

interface PendingComponentDeletion {
    pageId: string;
    componentId: string;
}

export const PagesPanel = ({ isOpen }: Props) => {
    const {
        pages,
        currentPageId,
        components,
        selectedComponentId,
        setCurrentPage,
        addPage,
        updatePage,
        deletePage,
        deleteComponentOnPage,
        navigateToPageComponent,
        saveToProject,
        getSyncedPages,
    } = useEditorStore();

    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);

    const [isEditMode, setIsEditMode] = useState(false);
    const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
    const [pendingPageIds, setPendingPageIds] = useState<string[]>([]);
    const [pendingComponents, setPendingComponents] = useState<PendingComponentDeletion[]>([]);

    const displayPages = useMemo(() => {
        const synced = getSyncedPages();
        return [...synced].sort((a, b) => a.order - b.order);
    }, [pages, components, currentPageId, getSyncedPages]);

    useEffect(() => {
        if (!currentPageId) {
            return;
        }
        setExpandedPageIds((prev) =>
            prev.includes(currentPageId) ? prev : [...prev, currentPageId]
        );
    }, [currentPageId]);

    if (!isOpen) {
        return null;
    }

    const isPageMarked = (pageId: string) => pendingPageIds.includes(pageId);

    const isComponentMarked = (pageId: string, componentId: string) =>
        pendingComponents.some(
            (item) => item.pageId === pageId && item.componentId === componentId
        );

    const togglePageExpanded = (pageId: string) => {
        setExpandedPageIds((prev) =>
            prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
        );
    };

    const handlePageNavigate = (pageId: string) => {
        if (isEditMode || isPageMarked(pageId)) {
            return;
        }
        setCurrentPage(pageId);
    };

    const handleComponentFocus = (pageId: string, componentId: string) => {
        if (isEditMode) {
            return;
        }
        navigateToPageComponent(pageId, componentId);
    };

    const toggleComponentDeletion = (pageId: string, componentId: string) => {
        setPendingComponents((prev) => {
            const exists = prev.some(
                (item) => item.pageId === pageId && item.componentId === componentId
            );
            if (exists) {
                return prev.filter(
                    (item) => !(item.pageId === pageId && item.componentId === componentId)
                );
            }
            return [...prev, { pageId, componentId }];
        });
    };

    const stagePageDeletion = (pageId: string) => {
        setPendingPageIds((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
        setPendingComponents((prev) => prev.filter((item) => item.pageId !== pageId));
    };

    const handleEditToggle = () => {
        if (!isEditMode) {
            setIsEditMode(true);
            return;
        }
    };

    const handleDone = async () => {
        Object.entries(editedTitles).forEach(([pageId, rawTitle]) => {
            const trimmedTitle = rawTitle.trim();
            if (!trimmedTitle) {
                return;
            }
            const route = `/${trimmedTitle.toLowerCase().replace(/\s+/g, '-')}`;
            updatePage(pageId, { title: trimmedTitle, route });
        });

        const pagesToDelete = [...pendingPageIds];
        const componentsToDelete = pendingComponents.filter(
            (item) => !pagesToDelete.includes(item.pageId)
        );

        componentsToDelete.forEach(({ pageId, componentId }) => {
            deleteComponentOnPage(pageId, componentId);
        });

        pagesToDelete.forEach((pageId) => {
            deletePage(pageId);
        });

        setPendingPageIds([]);
        setPendingComponents([]);
        setEditedTitles({});
        setIsEditMode(false);

        try {
            await saveToProject();
        } catch {
            // saveToProject shows error toast
        }
    };

    const handleAdd = async () => {
        const title = newTitle.trim();
        if (!title) {
            return;
        }
        addPage(title, `/${title.toLowerCase().replace(/\s+/g, '-')}`);
        setNewTitle('');
        try {
            await saveToProject();
        } catch {
            // handled in store
        }
    };

    const handleTitleDraftChange = (pageId: string, title: string) => {
        setEditedTitles((prev) => ({ ...prev, [pageId]: title }));
    };

    return (
        <div className={styles.pagesPanelWrapper}>
            <div className={styles.pagesPanel}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Страницы</h2>
                    <button
                        type="button"
                        className={`${styles.editToggle} ${isEditMode ? styles.editToggleActive : ''}`}
                        onClick={handleEditToggle}
                        disabled={isEditMode}
                        aria-label={isEditMode ? 'Режим редактирования' : 'Редактировать страницы'}
                        aria-pressed={isEditMode}
                    >
                        <img
                            src={isEditMode ? pencilActiveIcon : pencilInactiveIcon}
                            alt=""
                            className={styles.editToggleIcon}
                        />
                    </button>
                </div>

                <div className={styles.pageList}>
                    {displayPages.map((page) => {
                        const isExpanded = expandedPageIds.includes(page.id);
                        const isCurrent = page.id === currentPageId;
                        const pageMarked = isPageMarked(page.id);
                        const pageComponents =
                            page.id === currentPageId ? components : page.components;
                        const componentItems = buildPageComponentLabels(
                            pageComponents,
                            getComponentDefinition
                        );

                        return (
                            <div
                                key={page.id}
                                className={`${styles.pageBlock} ${pageMarked ? styles.pageBlockMarked : ''}`}
                            >
                                <div
                                    className={`${styles.pageHeader} ${isCurrent ? styles.pageHeaderActive : ''}`}
                                >
                                    <button
                                        type="button"
                                        className={styles.expandButton}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            togglePageExpanded(page.id);
                                        }}
                                        aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                                        aria-expanded={isExpanded}
                                    >
                                        <img
                                            src={arrowIcon}
                                            alt=""
                                            className={`${styles.arrowIcon} ${isExpanded ? styles.arrowExpanded : ''}`}
                                        />
                                    </button>

                                    {isEditMode ? (
                                        <input
                                            value={editedTitles[page.id] ?? page.title}
                                            onChange={(event) => handleTitleDraftChange(page.id, event.target.value)}
                                            onClick={(event) => event.stopPropagation()}
                                            className={styles.input}
                                            aria-label="Название страницы"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.pageTitleButton}
                                            onClick={() => handlePageNavigate(page.id)}
                                        >
                                            {page.title}
                                        </button>
                                    )}

                                    {isEditMode && displayPages.length > 1 ? (
                                        <Popconfirm
                                            title="Удалить страницу?"
                                            description="Страница и все элементы на ней будут удалены."
                                            okText="Удалить"
                                            cancelText="Отмена"
                                            onConfirm={() => stagePageDeletion(page.id)}
                                        >
                                            <button
                                                type="button"
                                                className={styles.deleteIconButton}
                                                onClick={(event) => event.stopPropagation()}
                                                aria-label="Удалить страницу"
                                            >
                                                <img src={crossIcon} alt="" className={styles.crossIcon} />
                                            </button>
                                        </Popconfirm>
                                    ) : null}
                                </div>

                                {isExpanded ? (
                                    <div className={styles.componentsBox}>
                                        {componentItems.length > 0 ? (
                                            componentItems.map((item) => {
                                                const componentMarked = isComponentMarked(
                                                    page.id,
                                                    item.id
                                                );
                                                const isSelected =
                                                    isCurrent && selectedComponentId === item.id;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`${styles.componentRow} ${isSelected ? styles.componentRowSelected : ''} ${componentMarked ? styles.componentRowMarked : ''}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={styles.componentLabelButton}
                                                            onClick={() =>
                                                                handleComponentFocus(page.id, item.id)
                                                            }
                                                            disabled={isEditMode}
                                                        >
                                                            <span className={styles.componentOrder}>
                                                                {item.order}.
                                                            </span>
                                                            {item.label}
                                                        </button>

                                                        {isEditMode ? (
                                                            <button
                                                                type="button"
                                                                className={styles.deleteIconButton}
                                                                onClick={() =>
                                                                    toggleComponentDeletion(
                                                                        page.id,
                                                                        item.id
                                                                    )
                                                                }
                                                                aria-label="Удалить элемент"
                                                            >
                                                                <img
                                                                    src={crossIcon}
                                                                    alt=""
                                                                    className={styles.crossIcon}
                                                                />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className={styles.emptyComponents}>Пусто</div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    {isEditMode ? (
                        <button type="button" className={styles.doneBtn} onClick={() => void handleDone()}>
                            Готово
                        </button>
                    ) : (
                        <>
                            <input
                                value={newTitle}
                                onChange={(event) => setNewTitle(event.target.value)}
                                placeholder="Введите название"
                                className={styles.input}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        void handleAdd();
                                    }
                                }}
                            />
                            <button type="button" onClick={() => void handleAdd()} className={styles.addBtn}>
                                Добавить новую страницу
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
