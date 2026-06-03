import { useRef } from 'react';
import { Select, DatePicker, Input } from 'antd';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import styles from './FilterWidget.module.css';

const FilterBindingStatus = ({
    targetIds,
    canvasComponents,
}: {
    targetIds: string[];
    canvasComponents: EditorComponent[];
}) => {
    const linkedCount = targetIds.filter((id) =>
        canvasComponents.some((item) => item.id === id && (item.type === 'table' || item.type === 'chart'))
    ).length;

    if (linkedCount > 0) {
        return <span className={styles.linkedBadge}>→ {linkedCount}</span>;
    }
    return <span className={styles.unlinkedBadge}>нет привязки</span>;
};

interface FilterWidgetProps {
    component: EditorComponent;
    /** Показывать статус привязки (только в режиме редактирования). */
    showBindingStatus?: boolean;
}

const STATUS_OPTIONS = [
    { value: 'lead', label: 'Лид' },
    { value: 'negotiation', label: 'Переговоры' },
    { value: 'deal', label: 'Сделка' },
    { value: 'closed', label: 'Закрыто' },
];

export const FilterWidget = ({ component, showBindingStatus = false }: FilterWidgetProps) => {
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const canvasComponents = useEditorStore((state) => state.components);
    const rootRef = useRef<HTMLDivElement>(null);
    const props = component.props ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];

    const filterType = (props.filterType as string) || 'status';
    const fieldKey = String(props.fieldKey ?? 'status');
    const label = String(props.label ?? 'Фильтр');
    const value = String(props.value ?? '');
    const valueTo = props.valueTo ? String(props.valueTo) : '';
    const patch = (patchProps: Record<string, unknown>) => {
        updateComponentProps(component.id, { ...props, ...patchProps });
    };

    const popupContainer = (trigger: HTMLElement) =>
        rootRef.current ?? trigger.parentElement ?? document.body;

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
            {filterType === 'status' ? (
                <Select
                    size="small"
                    className={styles.control}
                    value={value || undefined}
                    placeholder="Статус"
                    allowClear
                    onChange={(next) => patch({ value: next ?? '' })}
                    options={STATUS_OPTIONS}
                    getPopupContainer={popupContainer}
                    popupMatchSelectWidth
                />
            ) : null}
            {filterType === 'date' ? (
                <div className={styles.dateRow}>
                    <DatePicker
                        size="small"
                        className={styles.control}
                        getPopupContainer={popupContainer}
                        onChange={(_, dateString) =>
                            patch({ value: Array.isArray(dateString) ? dateString[0] : dateString })
                        }
                    />
                    <DatePicker
                        size="small"
                        className={styles.control}
                        getPopupContainer={popupContainer}
                        onChange={(_, dateString) =>
                            patch({ valueTo: Array.isArray(dateString) ? dateString[0] : dateString })
                        }
                    />
                </div>
            ) : null}
            {filterType === 'field' ? (
                <Input
                    size="small"
                    className={styles.control}
                    value={value}
                    placeholder={`Поле: ${fieldKey}`}
                    onChange={(event) => patch({ value: event.target.value })}
                />
            ) : null}
            {filterType === 'date' && valueTo ? (
                <span className={styles.rangeHint}>до {valueTo}</span>
            ) : null}
        </div>
    );
};
