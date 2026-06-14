import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/dataStore';
import { useEditorStore } from '../../../store/editorStore';
import { applyTableMapping, ensureTableRowIds } from '@/utils/dataMapping';
import { validateTableMapping } from '@/utils/dataValidation';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
import { getTableRowId, TABLE_ROW_ID_KEY } from '@/utils/tableColumns';
import type { TableColumnMapping } from '@/types/data';
import type { DataRow } from '@/utils/dataValidation';
import type { ComponentDataProps } from '@/types/data';
import styles from './TableWidget.module.css';

interface TableWidgetProps {
    componentId: string;
    props: ComponentDataProps & Record<string, unknown>;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    fontFamily?: string;
    backgroundColor?: string;
}

const stopCanvasBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
};

type TableColumn = { id: string; title: string };

type BandSelection =
    | { type: 'row'; rowId: string }
    | { type: 'column'; colId: string }
    | null;

const V_ALIGN_FLEX: Record<string, React.CSSProperties['alignItems']> = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
};

let uidCounter = 0;
const uid = () => `t${Date.now()}-${++uidCounter}`;

type ActiveCell = { rowId: string; colId: string; value: string };

export const TableWidget: React.FC<TableWidgetProps> = ({
    componentId,
    props,
    fontSize = 14,
    fontWeight = 400,
    color = '#000000',
    fontFamily = 'Raleway, sans-serif',
    backgroundColor = '#FFFFFF',
}) => {
    const { sources, loadData } = useDataStore();
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const canvasComponents = useEditorStore((state) => state.components);
    const isTableSelected = selectedComponentId === componentId;

    const [bandSelection, setBandSelection] = useState<BandSelection>(null);
    const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
    const activeCellRef = useRef<ActiveCell | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const skipSourceHydrationRef = useRef(false);
    const placeholderRowIdRef = useRef(uid());

    const dataSourceId = props.dataSourceId;
    const isDataBound = Boolean(dataSourceId && dataSourceId !== 'none');
    const source = sources.find((s) => s.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    useEffect(() => {
        if (!isTableSelected) {
            setBandSelection(null);
            setActiveCell(null);
        }
    }, [isTableSelected]);

    useEffect(() => {
        activeCellRef.current = activeCell;
    }, [activeCell]);

    const activeFilters = useMemo(
        () => collectFiltersForTarget(canvasComponents, componentId),
        [canvasComponents, componentId]
    );

    const placeholderColumns = useMemo((): TableColumn[] => {
        const raw = props.columns as string[] | undefined;
        if (raw?.length) return raw.map((title, i) => ({ id: `col${i + 1}`, title }));
        return [
            { id: 'col1', title: 'Колонка 1' },
            { id: 'col2', title: 'Колонка 2' },
            { id: 'col3', title: 'Колонка 3' },
        ];
    }, [props.columns]);

    const mappedFromSource = useMemo(() => {
        if (!isDataBound || !source?.data?.length) {
            return null;
        }
        const mappings = props.columnMappings as TableColumnMapping[] | undefined;
        const validation = validateTableMapping(source.data, mappings ?? []);
        if (!validation.valid) {
            return { error: validation.error ?? 'Ошибка сопоставления колонок' };
        }
        return applyTableMapping(source.data, mappings);
    }, [isDataBound, props.columnMappings, source?.data]);

    // Импорт из источника → локальная копия для ручного редактирования (один раз)
    useEffect(() => {
        if (skipSourceHydrationRef.current) {
            return;
        }
        if (!mappedFromSource || 'error' in mappedFromSource) {
            return;
        }

        const latestProps = useEditorStore.getState().components
            .find((component) => component.id === componentId)?.props;
        if (latestProps?.customData !== undefined && latestProps?.customColumns !== undefined) {
            skipSourceHydrationRef.current = true;
            return;
        }

        skipSourceHydrationRef.current = true;
        updateComponentProps(componentId, {
            customColumns: mappedFromSource.columns,
            customData: ensureTableRowIds(mappedFromSource.data as DataRow[]),
        });
    }, [mappedFromSource, componentId, updateComponentProps]);

    useEffect(() => {
        if (props.customData === undefined && props.customColumns === undefined) {
            skipSourceHydrationRef.current = false;
        }
    }, [props.customColumns, props.customData]);

    const { columns, displayData, validationError } = useMemo(() => {
        if (mappedFromSource && 'error' in mappedFromSource) {
            return {
                columns: [{ id: 'error', title: 'Ошибка' }],
                displayData: [{ id: 'error-row', error: mappedFromSource.error }] as DataRow[],
                validationError: mappedFromSource.error,
            };
        }

        const resolvedColumns = (props.customColumns as TableColumn[] | undefined)
            ?? (mappedFromSource?.columns as TableColumn[] | undefined)
            ?? placeholderColumns;
        const rawRows = (props.customData as DataRow[] | undefined)
            ?? (mappedFromSource?.data as DataRow[] | undefined)
            ?? [];

        return {
            columns: resolvedColumns,
            displayData: applyFiltersToRows(rawRows, activeFilters),
            validationError: null as string | null,
        };
    }, [
        activeFilters,
        mappedFromSource,
        placeholderColumns,
        props.customColumns,
        props.customData,
    ]);

    const sourceRows = useCallback((): DataRow[] => {
        if (props.customData) {
            return props.customData as DataRow[];
        }
        if (mappedFromSource && !('error' in mappedFromSource)) {
            return mappedFromSource.data as DataRow[];
        }
        return [];
    }, [props.customData, mappedFromSource]);

    const sourceColumns = useCallback((): TableColumn[] => {
        if (props.customColumns) {
            return props.customColumns as TableColumn[];
        }
        if (mappedFromSource && !('error' in mappedFromSource)) {
            return mappedFromSource.columns as TableColumn[];
        }
        return columns;
    }, [props.customColumns, mappedFromSource, columns]);

    const persist = useCallback(
        (
            nextCols: TableColumn[],
            nextRows: DataRow[],
            options?: { skipHistory?: boolean; skipSync?: boolean }
        ) => {
            skipSourceHydrationRef.current = true;
            updateComponentProps(
                componentId,
                { customColumns: nextCols, customData: ensureTableRowIds(nextRows) },
                options
            );
        },
        [componentId, updateComponentProps]
    );

    const commitCellValue = useCallback(
        (rowId: string, colId: string, value: string) => {
            const rows = sourceRows();
            if (rows.length === 0) {
                const newRow: DataRow = {
                    [TABLE_ROW_ID_KEY]: rowId,
                    ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])),
                    [colId]: value,
                };
                persist(sourceColumns(), [newRow]);
                return;
            }
            const updated = rows.map((row) =>
                getTableRowId(row) === rowId ? { ...row, [colId]: value } : row
            );
            persist(sourceColumns(), updated);
        },
        [persist, sourceColumns, sourceRows]
    );

    const handleCellFocus = (rowId: string, colId: string, currentValue: string) => {
        setBandSelection(null);
        setActiveCell({ rowId, colId, value: currentValue });
    };

    const handleCellChange = (rowId: string, colId: string, value: string) => {
        setActiveCell({ rowId, colId, value });
    };

    const handleCellBlur = (rowId: string, colId: string) => {
        const current = activeCellRef.current;
        if (current?.rowId === rowId && current.colId === colId) {
            commitCellValue(current.rowId, current.colId, current.value);
        }
        setActiveCell(null);
    };

    const getCellDisplayValue = (row: DataRow, colId: string): string => {
        const rowId = getTableRowId(row);
        if (activeCell?.rowId === rowId && activeCell.colId === colId) {
            return activeCell.value;
        }
        return String(row[colId] ?? '');
    };

    // Если ещё нет customData — возвращаем одну пустую строку для вставки
    const ensureRows = useCallback((): DataRow[] => {
        const rows = sourceRows();
        if (rows.length > 0) return rows;
        return [{ [TABLE_ROW_ID_KEY]: uid(), ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])) }];
    }, [sourceRows, sourceColumns]);

    const handleHeaderChange = (colId: string, newTitle: string) => {
        const updatedCols = sourceColumns().map((c) => c.id === colId ? { ...c, title: newTitle } : c);
        persist(updatedCols, sourceRows());
    };

    const insertColumnAfter = (index: number) => {
        const newColId = uid();
        const cols = [...sourceColumns()];
        cols.splice(index + 1, 0, { id: newColId, title: 'Новая' });
        const rows = ensureRows().map((r) => ({ ...r, [newColId]: '' }));
        persist(cols, rows);
    };

    const insertRowAfter = (index: number) => {
        const newRow: DataRow = {
            [TABLE_ROW_ID_KEY]: uid(),
            ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])),
        };
        const rows = [...ensureRows()];
        rows.splice(index + 1, 0, newRow);
        persist(sourceColumns(), rows);
    };

    const removeColumn = useCallback((colId: string) => {
        const cols = sourceColumns();
        if (cols.length <= 1) return;
        const updatedCols = cols.filter((c) => c.id !== colId);
        const updatedRows = sourceRows().map((r) => {
            const { [colId]: _, ...rest } = r;
            return rest as DataRow;
        });
        persist(updatedCols, updatedRows);
        setBandSelection(null);
    }, [sourceColumns, sourceRows, persist]);

    const removeRow = useCallback((rowId: string) => {
        const rows = sourceRows();
        if (rows.length <= 1) return;
        persist(sourceColumns(), rows.filter((row) => getTableRowId(row) !== rowId));
        setBandSelection(null);
    }, [sourceRows, sourceColumns, persist]);

    // Backspace/Delete когда выбрана полоса
    useEffect(() => {
        if (!isTableSelected || !bandSelection) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Backspace' && e.key !== 'Delete') return;
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
            e.preventDefault();
            e.stopPropagation();
            if (bandSelection.type === 'column') removeColumn(bandSelection.colId);
            else removeRow(bandSelection.rowId);
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [bandSelection, isTableSelected, removeColumn, removeRow]);

    const isRowSel = (id: string) => bandSelection?.type === 'row' && bandSelection.rowId === id;
    const isColSel = (id: string) => bandSelection?.type === 'column' && bandSelection.colId === id;

    const textAlign = (props.textAlign as string) || 'left';
    const verticalAlign = (props.verticalAlign as string) || 'top';

    const cellAlignStyle = (): React.CSSProperties => ({
        alignItems: V_ALIGN_FLEX[verticalAlign] ?? 'flex-start',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
    });
    const inputAlignStyle: React.CSSProperties = { textAlign: textAlign as React.CSSProperties['textAlign'] };

    const typographyStyle: React.CSSProperties = {
        fontSize,
        fontWeight,
        color,
        fontFamily,
    };

    // Строки для рендера: при пустых данных и фокусе — одна пустая строка с реальным id
    const renderRows: DataRow[] = useMemo(() => {
        if (displayData.length > 0) return displayData;
        if (isTableSelected) {
            return [{
                [TABLE_ROW_ID_KEY]: placeholderRowIdRef.current,
                ...Object.fromEntries(columns.map((c) => [c.id, ''])),
            }];
        }
        return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayData, isTableSelected, columns.length]);

    const gridTemplateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;

    if (source?.isLoading) return <div className={styles.stateMessage}>Загрузка данных...</div>;
    if (source?.error) return <div className={`${styles.stateMessage} ${styles.stateError}`}>Ошибка: {source.error}</div>;
    if (displayData.length === 0 && activeFilters.length > 0) {
        return (
            <div className={`${styles.stateMessage} ${styles.stateWarning}`}>
                Нет строк по фильтру формы/поиска. Проверьте ключи полей и привязку к таблице.
            </div>
        );
    }
    if (validationError) {
        return (
            <div className={`${styles.stateMessage} ${styles.stateWarning}`}>
                Данные таблицы: {validationError}
            </div>
        );
    }

    return (
        <div
            ref={wrapperRef}
            className={styles.tableWrapper}
            data-table-id={componentId}
            style={{ backgroundColor }}
        >
            <div className={styles.tableGrid} style={typographyStyle}>
                {/* Заголовки */}
                <div className={styles.headerRow} style={{ gridTemplateColumns }}>
                    {columns.map((col, colIndex) => (
                        <div
                            key={col.id}
                            className={`${styles.headerCell} ${isColSel(col.id) ? styles.bandSelected : ''}`}
                        >
                            <input
                                className={styles.editInput}
                                style={{ ...typographyStyle, ...inputAlignStyle }}
                                value={col.title}
                                onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                onFocus={() => setBandSelection(null)}
                                onMouseDown={stopCanvasBubble}
                                onClick={stopCanvasBubble}
                                placeholder="Заголовок"
                            />
                            {isTableSelected && (
                                <>
                                    {/* Выбор колонки — верхняя полоска */}
                                    <button
                                        type="button"
                                        className={styles.colSelectStrip}
                                        tabIndex={-1}
                                        onMouseDown={stopCanvasBubble}
                                        onClick={(e) => { e.stopPropagation(); setBandSelection({ type: 'column', colId: col.id }); }}
                                    />
                                    {/* + добавить колонку справа */}
                                    <button
                                        type="button"
                                        className={styles.insertHandleCol}
                                        title="Добавить столбец справа"
                                        onMouseDown={stopCanvasBubble}
                                        onClick={(e) => { e.stopPropagation(); insertColumnAfter(colIndex); }}
                                    >
                                        <PlusOutlined />
                                    </button>
                                    {/* × удалить колонку — при выборе */}
                                    {isColSel(col.id) && (
                                        <button
                                            type="button"
                                            className={styles.deleteHandleCol}
                                            title="Удалить столбец"
                                            onMouseDown={stopCanvasBubble}
                                            onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
                                        >
                                            <CloseOutlined />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Строки */}
                <div className={styles.bodyRows}>
                    {renderRows.map((row, rowIndex) => {
                        const rowId = getTableRowId(row);
                        return (
                        <div
                            key={rowId}
                            className={`${styles.dataRow} ${isRowSel(rowId) ? styles.rowBandSelected : ''}`}
                            style={{ gridTemplateColumns }}
                        >
                            {columns.map((col) => (
                                <div
                                    key={`${rowId}-${col.id}`}
                                    className={`${styles.bodyCell} ${isColSel(col.id) ? styles.bandSelected : ''}`}
                                >
                                    <div className={styles.cellInner} style={cellAlignStyle()}>
                                        <input
                                            className={styles.editInput}
                                            style={{ ...typographyStyle, ...inputAlignStyle }}
                                            value={getCellDisplayValue(row, col.id)}
                                            onChange={(e) => handleCellChange(rowId, col.id, e.target.value)}
                                            onFocus={(e) => handleCellFocus(rowId, col.id, e.target.value)}
                                            onBlur={() => handleCellBlur(rowId, col.id)}
                                            onMouseDown={stopCanvasBubble}
                                            onClick={stopCanvasBubble}
                                        />
                                    </div>
                                </div>
                            ))}
                            {isTableSelected && (
                                <>
                                    <button
                                        type="button"
                                        className={styles.rowSelectStrip}
                                        tabIndex={-1}
                                        onMouseDown={stopCanvasBubble}
                                        onClick={(e) => { e.stopPropagation(); setBandSelection({ type: 'row', rowId }); }}
                                    />
                                    {isRowSel(rowId) && (
                                        <button
                                            type="button"
                                            className={styles.deleteHandleRow}
                                            title="Удалить строку"
                                            onMouseDown={stopCanvasBubble}
                                            onClick={(e) => { e.stopPropagation(); removeRow(rowId); }}
                                        >
                                            <CloseOutlined />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.insertHandleRow}
                                        title="Добавить строку ниже"
                                        onMouseDown={stopCanvasBubble}
                                        onClick={(e) => { e.stopPropagation(); insertRowAfter(rowIndex); }}
                                    >
                                        <PlusOutlined />
                                    </button>
                                </>
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
