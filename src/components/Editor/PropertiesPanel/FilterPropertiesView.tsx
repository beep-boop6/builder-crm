import { useEffect, useMemo } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import { ComponentTargetsSection } from './ComponentTargetsSection';
import { PropertySection, PropertySelect, PropertyTextInput } from './PropertyFields';
import {
    getLinkedTableComponent,
    resolveTableColumns,
} from '@/utils/tableColumns';
import styles from './PropertiesPanel.module.css';

interface Props {
    component: EditorComponent;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

export const FilterPropertiesView = ({
    component,
    onUpdateProps,
}: Props) => {
    const canvasComponents = useEditorStore((state) => state.components);
    const sources = useDataStore((state) => state.sources);
    const loadData = useDataStore((state) => state.loadData);
    const props = component.props ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];

    const patch = (patchProps: Record<string, unknown>) => {
        onUpdateProps({ ...props, ...patchProps });
    };

    const filterType = (props.filterType as string) || 'status';
    const fieldKey = String(props.fieldKey ?? '');

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

    useEffect(() => {
        if (!fieldKey || columnOptions.length === 0) {
            return;
        }
        if (!columnOptions.some((column) => column.id === fieldKey)) {
            patch({ fieldKey: '', value: '', valueTo: '' });
        }
    }, [columnOptions, fieldKey]);

    return (
        <>
            <ComponentTargetsSection
                excludeComponentId={component.id}
                targetComponentIds={targetIds}
                linkableTypes={['table']}
                hint="Выберите таблицу — фильтр подтянет её заголовки колонок."
                onChange={(ids) => patch({ targetComponentIds: ids })}
            />

            <PropertySection title="Колонка таблицы">
                {linkedTable ? (
                    columnOptions.length > 0 ? (
                        <PropertySelect
                            value={fieldKey}
                            onChange={(event) => {
                                const nextKey = event.target.value;
                                const column = columnOptions.find((item) => item.id === nextKey);
                                patch({
                                    fieldKey: nextKey,
                                    value: '',
                                    valueTo: '',
                                    ...(column ? { label: column.title } : {}),
                                });
                            }}
                            options={[
                                { value: '', label: '— выберите колонку —' },
                                ...columnOptions.map((column) => ({
                                    value: column.id,
                                    label: column.title,
                                })),
                            ]}
                        />
                    ) : (
                        <p className={styles.hintText}>У таблицы пока нет колонок</p>
                    )
                ) : (
                    <p className={styles.hintTextWarning}>Сначала привяжите фильтр к таблице</p>
                )}
            </PropertySection>

            <PropertySection title="Тип фильтра">
                <PropertySelect
                    value={filterType}
                    onChange={(event) => patch({ filterType: event.target.value, value: '', valueTo: '' })}
                    options={[
                        { value: 'status', label: 'По значению (список)' },
                        { value: 'date', label: 'По дате' },
                        { value: 'field', label: 'По тексту (содержит)' },
                    ]}
                />
            </PropertySection>

            <PropertySection title="Заголовок">
                <PropertyTextInput
                    value={String(props.label ?? 'Фильтр')}
                    placeholder="Заголовок фильтра"
                    onChange={(event) => patch({ label: event.target.value })}
                />
            </PropertySection>

            <p className={styles.hintText}>
                Фильтр берёт заголовки из привязанной таблицы. Выберите колонку и тип фильтра — таблица
                на холсте сузится по выбранному значению.
            </p>
        </>
    );
};
