import { useEffect } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import { ChartMappingSection } from './DataMappingSection';
import {
    LayoutSections,
    PropertyColorInput,
    PropertySection,
    PropertySelect,
} from './PropertyFields';

interface ChartPropertiesViewProps {
    component: EditorComponent;
    onUpdate: (key: keyof EditorComponent, value: string | number) => void;
    onUpdateProps: (props: Record<string, unknown>) => void;
    onDataSourceChange: (dataSourceId: string) => void;
}

export const ChartPropertiesView = ({
    component,
    onUpdate,
    onUpdateProps,
    onDataSourceChange,
}: ChartPropertiesViewProps) => {
    const { sources, loadData } = useDataStore();
    const dataSourceId = component.props?.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === dataSourceId);
    const chartMapping = (component.props?.chartMapping as { xField: string; yField: string } | undefined) ?? {
        xField: (component.props?.xAxisKey as string) ?? '',
        yField: (component.props?.yAxisKey as string) ?? '',
    };
    const chartColor =
        (component.props?.style as { color?: string } | undefined)?.color
        ?? (component.props?.color as string | undefined)
        ?? '#1976d2';
    const chartBackgroundColor =
        (component.props?.backgroundColor as string | undefined)
        ?? component.backgroundColor
        ?? '#FFFFFF';

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    const dataSourceOptions = [
        { value: 'none', label: '— Выберите источник —' },
        ...sources.map((src) => ({ value: src.id, label: src.name })),
    ];

    return (
        <>
            <PropertySection title="Источник данных">
                <PropertySelect
                    value={dataSourceId || 'none'}
                    onChange={(event) => onDataSourceChange(event.target.value)}
                    options={dataSourceOptions}
                />
            </PropertySection>

            {dataSourceId && dataSourceId !== 'none' && (
                <>
                    <PropertySection title="Тип графика">
                        <PropertySelect
                            value={(component.props?.chartType as string) || 'bar'}
                            onChange={(event) => onUpdateProps({ chartType: event.target.value })}
                            options={[
                                { value: 'bar', label: 'Столбчатый (Bar)' },
                                { value: 'line', label: 'Линейный (Line)' },
                            ]}
                        />
                    </PropertySection>

                    <ChartMappingSection
                        source={source}
                        xField={chartMapping.xField}
                        yField={chartMapping.yField}
                        onChange={(mapping) => onUpdateProps({
                            chartMapping: mapping,
                            xAxisKey: mapping.xField,
                            yAxisKey: mapping.yField,
                        })}
                        onReload={() => loadData(dataSourceId)}
                    />
                </>
            )}

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
            />
        </>
    );
};
