import { useEffect, useMemo } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import { useComponentStore } from '@/store/componentStore';
import { getComponentMinSize } from '@/utils/componentMinSize';
import { resolveTableColumns, resolveTableRows } from '@/utils/tableColumns';
import { ChartTableMappingSection } from './DataMappingSection';
import {
    LayoutSections,
    PropertyColorInput,
    PropertySection,
    PropertySelect,
} from './PropertyFields';
import styles from './PropertiesPanel.module.css';

interface ChartPropertiesViewProps {
    component: EditorComponent;
    onUpdate: (key: keyof EditorComponent, value: string | number) => void;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

export const ChartPropertiesView = ({
    component,
    onUpdate,
    onUpdateProps,
}: ChartPropertiesViewProps) => {
    const canvasComponents = useEditorStore((state) => state.components);
    const { sources, loadData } = useDataStore();
    const tableComponentId = component.props?.tableComponentId as string | undefined;
    const chartMapping = (component.props?.chartMapping as { xField: string; yField: string } | undefined) ?? {
        xField: (component.props?.xAxisKey as string) ?? '',
        yField: (component.props?.yAxisKey as string) ?? '',
    };
    const chartColor =
        (component.props?.style as { color?: string } | undefined)?.color
        ?? (component.props?.color as string | undefined)
        ?? '#E8E8E8';
    const chartBackgroundColor =
        (component.props?.backgroundColor as string | undefined)
        ?? component.backgroundColor
        ?? '#FFFFFF';
    const componentDefinition = useComponentStore.getState().getComponentDefinition(component.type);
    const { minWidth, minHeight } = getComponentMinSize(component, componentDefinition);

    const tableOptions = useMemo(
        () =>
            canvasComponents
                .filter((item) => item.type === 'table')
                .map((item) => ({
                    value: item.id,
                    label: item.text?.trim() || 'Таблица',
                })),
        [canvasComponents]
    );

    const linkedTable = useMemo(
        () => canvasComponents.find((item) => item.id === tableComponentId && item.type === 'table'),
        [canvasComponents, tableComponentId]
    );

    const linkedTableDataSourceId = linkedTable?.props?.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === linkedTableDataSourceId);

    useEffect(() => {
        if (
            linkedTableDataSourceId
            && linkedTableDataSourceId !== 'none'
            && source
            && !source.data
            && !source.isLoading
            && !source.error
        ) {
            loadData(linkedTableDataSourceId);
        }
    }, [linkedTableDataSourceId, source, loadData]);

    const columnOptions = useMemo(
        () => resolveTableColumns(linkedTable, source?.data),
        [linkedTable, source?.data]
    );

    const previewRows = useMemo(
        () => resolveTableRows(linkedTable, source?.data),
        [linkedTable, source?.data]
    );

    const handleTableChange = (nextTableId: string) => {
        const table = canvasComponents.find((item) => item.id === nextTableId && item.type === 'table');
        const tableSourceId = table?.props?.dataSourceId as string | undefined;
        const tableSource = tableSourceId ? sources.find((item) => item.id === tableSourceId) : undefined;
        const columns = resolveTableColumns(table, tableSource?.data);
        const xField = columns[0]?.id ?? '';
        const yField = columns[1]?.id ?? columns[0]?.id ?? '';

        onUpdateProps({
            tableComponentId: nextTableId || undefined,
            dataSourceId: undefined,
            chartMapping: { xField, yField },
            xAxisKey: xField,
            yAxisKey: yField,
        });
    };

    return (
        <>
            <PropertySection title="Таблица">
                <PropertySelect
                    value={tableComponentId || ''}
                    onChange={(event) => handleTableChange(event.target.value)}
                    options={[
                        { value: '', label: '— выберите таблицу —' },
                        ...tableOptions,
                    ]}
                />
                {tableOptions.length === 0 ? (
                    <p className={styles.hintTextWarning}>Добавьте на страницу таблицу</p>
                ) : null}
            </PropertySection>

            {linkedTable ? (
                <>
                    <PropertySection title="Тип графика">
                        <PropertySelect
                            value={(component.props?.chartType as string) || 'bar'}
                            onChange={(event) => onUpdateProps({ chartType: event.target.value })}
                            options={[
                                { value: 'bar', label: 'Столбчатый' },
                                { value: 'line', label: 'Линейный' },
                                { value: 'pie', label: 'Круговой' },
                            ]}
                        />
                    </PropertySection>

                    <ChartTableMappingSection
                        columns={columnOptions}
                        rows={previewRows}
                        xField={chartMapping.xField}
                        yField={chartMapping.yField}
                        onChange={(mapping) => onUpdateProps({
                            chartMapping: mapping,
                            xAxisKey: mapping.xField,
                            yAxisKey: mapping.yField,
                        })}
                    />
                </>
            ) : null}

            <PropertySection title="Цвет графика">
                <PropertyColorInput
                    color={chartColor}
                    hexValue={chartColor.replace('#', '').toUpperCase()}
                    onChange={(value) => {
                        onUpdateProps({
                            color: value,
                            style: {
                                ...((component.props?.style as Record<string, unknown>) ?? {}),
                                color: value,
                            },
                        });
                    }}
                />
            </PropertySection>

            <PropertySection title="Цвет фона">
                <PropertyColorInput
                    color={chartBackgroundColor}
                    hexValue={chartBackgroundColor.replace('#', '').toUpperCase()}
                    onChange={(value) => {
                        onUpdate('backgroundColor', value);
                        onUpdateProps({ backgroundColor: value });
                    }}
                />
            </PropertySection>

            <LayoutSections
                component={component}
                onUpdate={(key, value) => onUpdate(key, value)}
                minWidth={minWidth}
                minHeight={minHeight}
                hideAlignment={true}
            />
        </>
    );
};
