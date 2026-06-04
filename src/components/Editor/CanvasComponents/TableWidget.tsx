import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/dataStore';
import { useEditorStore } from '../../../store/editorStore';
import { applyTableMapping } from '@/utils/dataMapping';
import { validateTableMapping } from '@/utils/dataValidation';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
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
    const wrapperRef = useRef<HTMLDivElement>(null);

    const dataSourceId = props.dataSourceId;
    const isDataBound = Boolean(dataSourceId && dataSourceId !== 'none');
    const source = sources.find((s) => s.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    useEffect(() => {
        if (!isTableSelected) setBandSelection(null);
    }, [isTableSelected]);

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

    // Колонки и строки для отображения (могут быть отфильтрованы)
    const { columns, displayData, validationError } = useMemo(() => {
        if (isDataBound) {
            if (!source?.data || source.data.length === 0) {
                return { columns: placeholderColumns, displayData: [] as DataRow[], validationError: null };
            }
            const mappings = props.columnMappings as TableColumnMapping[] | undefined;
            const validation = validateTableMapping(source.data, mappings ?? []);
            if (!validation.valid) {
                return {
                    columns: [{ id: 'error', title: 'Ошибка' }],
                    displayData: [{ id: 'error-row', error: validation.error }] as DataRow[],
                    validationError: validation.error ?? null,
                };
            }
            const mapped = applyTableMapping(source.data, mappings);
            return {
                columns: mapped.columns as TableColumn[],
                displayData: applyFiltersToRows(mapped.data as DataRow[], activeFilters),
                validationError: null,
            };
        }

        if (props.customData && props.customColumns) {
            return {
                columns: props.customColumns as TableColumn[],
                displayData: applyFiltersToRows(props.customData as DataRow[], activeFilters),
                validationError: null as string | null,
            };
        }

        return { columns: placeholderColumns, displayData: [] as DataRow[], validationError: null };
    }, [
        activeFilters,
        isDataBound,
        placeholderColumns,
        props.customColumns,
        props.customData,
        props.columnMappings,
        source?.data,
    ]);

    // Исходные (нефильтрованные) строки — только для мутаций
    const sourceRows = useCallback((): DataRow[] => {
        if (props.customData) return props.customData as DataRow[];
        return [];
    }, [props.customData]);

    const sourceColumns = useCallback((): TableColumn[] => {
        if (props.customColumns) return props.customColumns as TableColumn[];
        return columns;
    }, [props.customColumns, columns]);

    const persist = useCallback(
        (nextCols: TableColumn[], nextRows: DataRow[]) => {
            if (isDataBound) {
                return;
            }
            updateComponentProps(componentId, { customColumns: nextCols, customData: nextRows });
        },
        [componentId, isDataBound, updateComponentProps]
    );

    // Если ещё нет customData — возвращаем одну пустую строку для вставки
    const ensureRows = useCallback((): DataRow[] => {
        const rows = sourceRows();
        if (rows.length > 0) return rows;
        return [{ id: uid(), ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])) }];
    }, [sourceRows, sourceColumns]);

    const handleHeaderChange = (colId: string, newTitle: string) => {
        const updatedCols = sourceColumns().map((c) => c.id === colId ? { ...c, title: newTitle } : c);
        persist(updatedCols, sourceRows());
    };

    const handleCellChange = (rowId: string, colId: string, value: string) => {
        const rows = sourceRows();
        if (rows.length === 0) {
            // Таблица пустая — создаём первую строку
            const newRow: DataRow = { id: rowId, ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])), [colId]: value };
            persist(sourceColumns(), [newRow]);
            return;
        }
        const updated = rows.map((r) => r.id === rowId ? { ...r, [colId]: value } : r);
        persist(sourceColumns(), updated);
    };

    const insertColumnAfter = (index: number) => {
        const newColId = uid();
        const cols = [...sourceColumns()];
        cols.splice(index + 1, 0, { id: newColId, title: 'Новая' });
        const rows = ensureRows().map((r) => ({ ...r, [newColId]: '' }));
        persist(cols, rows);
    };

    const insertRowAfter = (index: number) => {
        const newRow: DataRow = { id: uid(), ...Object.fromEntries(sourceColumns().map((c) => [c.id, ''])) };
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
        persist(sourceColumns(), rows.filter((r) => r.id !== rowId));
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
        if (!isDataBound && isTableSelected) {
            return [{ id: uid(), ...Object.fromEntries(columns.map((c) => [c.id, ''])) }];
        }
        return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayData, isDataBound, isTableSelected, columns.length]);

    const gridTemplateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;

    if (source?.isLoading) return <div className={styles.stateMessage}>Загрузка данных...</div>;
    if (source?.error) return <div className={`${styles.stateMessage} ${styles.stateError}`}>Ошибка: {source.error}</div>;
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
                                readOnly={isDataBound}
                                onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                onFocus={() => setBandSelection(null)}
                                onMouseDown={stopCanvasBubble}
                                onClick={stopCanvasBubble}
                                placeholder="Заголовок"
                            />
                            {isTableSelected && !isDataBound && (
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
                    {renderRows.map((row, rowIndex) => (
                        <div
                            key={String(row.id)}
                            className={`${styles.dataRow} ${isRowSel(String(row.id)) ? styles.rowBandSelected : ''}`}
                            style={{ gridTemplateColumns }}
                        >
                            {columns.map((col) => (
                                <div
                                    key={`${row.id}-${col.id}`}
                                    className={`${styles.bodyCell} ${isColSel(col.id) ? styles.bandSelected : ''}`}
                                >
                                    <div className={styles.cellInner} style={cellAlignStyle()}>
                                        <input
                                            className={styles.editInput}
                                            style={{ ...typographyStyle, ...inputAlignStyle }}
                                            value={String(row[col.id] ?? '')}
                                            readOnly={isDataBound}
                                            onChange={(e) => handleCellChange(String(row.id), col.id, e.target.value)}
                                            onFocus={() => setBandSelection(null)}
                                            onMouseDown={stopCanvasBubble}
                                            onClick={stopCanvasBubble}
                                        />
                                    </div>
                                </div>
                            ))}
                            {isTableSelected && !isDataBound && (
                                <>
                                    {/* Выбор строки — левая полоска */}
                                    <button
                                        type="button"
                                        className={styles.rowSelectStrip}
                                        tabIndex={-1}
                                        onMouseDown={stopCanvasBubble}
                                        onClick={(e) => { e.stopPropagation(); setBandSelection({ type: 'row', rowId: String(row.id) }); }}
                                    />
                                    {/* × удалить строку — при выборе */}
                                    {isRowSel(String(row.id)) && (
                                        <button
                                            type="button"
                                            className={styles.deleteHandleRow}
                                            title="Удалить строку"
                                            onMouseDown={stopCanvasBubble}
                                            onClick={(e) => { e.stopPropagation(); removeRow(String(row.id)); }}
                                        >
                                            <CloseOutlined />
                                        </button>
                                    )}
                                    {/* + добавить строку снизу */}
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
                    ))}
                </div>
            </div>
        </div>
    );
};
