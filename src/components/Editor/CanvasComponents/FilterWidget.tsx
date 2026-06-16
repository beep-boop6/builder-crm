import { useEffect, useMemo, useRef, useCallback } from 'react';
import { Select, DatePicker, Input } from 'antd';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import {
    getDistinctColumnValues,
    getLinkedTableComponent,
    resolveTableColumns,
    resolveTableRows,
} from '@/utils/tableColumns';
import { isFilterValueInvalid } from '@/utils/filterValidation';
import { formatDisplayValue } from '@/utils/displayLabels';
import { getCanvasPopupContainer, useCanvasPortal } from '@/components/Editor/Canvas/CanvasPortalContext';
import styles from './FilterWidget.module.css';

const FilterBindingStatus = ({
    targetIds,
    canvasComponents,
}: {
    targetIds: string[];
    canvasComponents: EditorComponent[];
}) => {
    const linkedTable = getLinkedTableComponent(canvasComponents, targetIds);

    if (linkedTable) {
        return <span className={styles.linkedBadge}>→ таблица</span>;
    }
    return <span className={styles.unlinkedBadge}>нет привязки</span>;
};

interface FilterWidgetProps {
    component: EditorComponent;
    /** Показывать статус привязки (только в режиме редактирования). */
    showBindingStatus?: boolean;
}

const FALLBACK_STATUS_OPTIONS = [
    { value: 'Лид', label: 'Лид' },
    { value: 'Переговоры', label: 'Переговоры' },
    { value: 'Сделка', label: 'Сделка' },
    { value: 'Закрыто', label: 'Закрыто' },
];

export const FilterWidget = ({ component, showBindingStatus = false }: FilterWidgetProps) => {
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const canvasComponents = useEditorStore((state) => state.components);
    const sources = useDataStore((state) => state.sources);
    const loadData = useDataStore((state) => state.loadData);
    const rootRef = useRef<HTMLDivElement>(null);
    const props = component.props ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];

    const filterType = (props.filterType as string) || 'status';
    const fieldKey = String(props.fieldKey ?? '');
    const label = String(props.label ?? 'Фильтр');
    const value = String(props.value ?? '');
    const valueTo = props.valueTo ? String(props.valueTo) : '';
    const valueInvalid = props.valueInvalid === true;

    const linkedTable = useMemo(
        () => getLinkedTableComponent(canvasComponents, targetIds),
        [canvasComponents, targetIds]
    );

    const tableProps = linkedTable?.props ?? {};
    const dataSourceId = tableProps.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, loadData, source]);

    const columnOptions = useMemo(() => {
        return resolveTableColumns(linkedTable, source?.data);
    }, [linkedTable, source?.data]);

    const tableRows = useMemo(() => {
        return resolveTableRows(linkedTable, source?.data);
    }, [linkedTable, source?.data]);

    const statusOptions = useMemo(() => {
        if (!fieldKey) {
            return FALLBACK_STATUS_OPTIONS;
        }
        const distinct = getDistinctColumnValues(tableRows, fieldKey);
        if (distinct.length === 0) {
            return FALLBACK_STATUS_OPTIONS;
        }
        return distinct.map((item) => ({ value: item, label: formatDisplayValue(item) }));
    }, [fieldKey, tableRows]);

    const patch = (patchProps: Record<string, unknown>) => {
        updateComponentProps(component.id, { ...props, ...patchProps });
    };

    const handleColumnChange = (nextFieldKey: string | undefined) => {
        const nextKey = nextFieldKey ?? '';
        const column = columnOptions.find((item) => item.id === nextKey);
        patch({
            fieldKey: nextKey,
            value: '',
            valueTo: '',
            valueInvalid: false,
            ...(column ? { label: column.title } : {}),
        });
    };

    const handleValueChange = (nextValue: string) => {
        const invalid = isFilterValueInvalid(filterType, tableRows, fieldKey, nextValue);
        patch({ value: nextValue, valueInvalid: invalid });
    };

    const textInputStatus = valueInvalid ? 'error' : undefined;

    const canvasPortal = useCanvasPortal();

    const popupContainer = useCallback(
        (trigger: HTMLElement) => getCanvasPopupContainer(canvasPortal, trigger),
        [canvasPortal]
    );

    const stopCanvasBubble = (event: React.SyntheticEvent) => {
        event.stopPropagation();
    };

    const selectPopupProps = {
        getPopupContainer: popupContainer,
        popupClassName: styles.filterPopup,
        onMouseDown: stopCanvasBubble,
        onClick: stopCanvasBubble,
    };

    const datePopupProps = {
        getPopupContainer: popupContainer,
        popupClassName: styles.filterPopup,
        onMouseDown: stopCanvasBubble,
        onClick: stopCanvasBubble,
    };

    return (
        <div
            ref={rootRef}
            className={styles.filterWidget}
            style={{ backgroundColor: component.backgroundColor || '#fff' }}
        >
            <div className={styles.headerRow}>
                <span className={styles.label}>{label}</span>
                {showBindingStatus ? (
                    <FilterBindingStatus targetIds={targetIds} canvasComponents={canvasComponents} />
                ) : null}
            </div>

            {linkedTable ? (
                <Select
                    size="small"
                    className={styles.control}
                    value={fieldKey || undefined}
                    placeholder="Колонка таблицы"
                    allowClear
                    onChange={handleColumnChange}
                    options={columnOptions.map((column) => ({
                        value: column.id,
                        label: column.title,
                    }))}
                    popupMatchSelectWidth
                    {...selectPopupProps}
                />
            ) : (
                <span className={styles.noTableHint}>Привяжите фильтр к таблице</span>
            )}

            {fieldKey && filterType === 'status' ? (
                <Select
                    size="small"
                    className={styles.control}
                    value={value || undefined}
                    placeholder="Значение"
                    allowClear
                    onChange={(next) => patch({ value: next ?? '' })}
                    options={statusOptions}
                    popupMatchSelectWidth
                    {...selectPopupProps}
                />
            ) : null}

            {fieldKey && filterType === 'date' ? (
                <div className={styles.dateRow}>
                    <DatePicker
                        size="small"
                        className={styles.control}
                        placement="bottomLeft"
                        {...datePopupProps}
                        onChange={(_, dateString) =>
                            patch({ value: Array.isArray(dateString) ? dateString[0] : dateString })
                        }
                    />
                    <DatePicker
                        size="small"
                        className={styles.control}
                        placement="bottomLeft"
                        {...datePopupProps}
                        onChange={(_, dateString) =>
                            patch({ valueTo: Array.isArray(dateString) ? dateString[0] : dateString })
                        }
                    />
                </div>
            ) : null}

            {fieldKey && filterType === 'field' ? (
                <Input
                    size="small"
                    className={styles.control}
                    value={value}
                    status={textInputStatus}
                    placeholder="Значение для поиска"
                    onChange={(event) => handleValueChange(event.target.value)}
                />
            ) : null}

            {fieldKey && filterType === 'number' ? (
                <Input
                    size="small"
                    className={styles.control}
                    value={value}
                    status={textInputStatus}
                    placeholder="Числовое значение"
                    inputMode="decimal"
                    onChange={(event) => handleValueChange(event.target.value)}
                />
            ) : null}

            {fieldKey && filterType === 'date' && valueTo ? (
                <span className={styles.rangeHint}>до {valueTo}</span>
            ) : null}

            {valueInvalid ? (
                <span className={styles.validationHint}>Введите числовое значение</span>
            ) : null}
        </div>
    );
};
