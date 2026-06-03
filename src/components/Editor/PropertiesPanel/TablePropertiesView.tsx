import { useEffect } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import type { TableColumnMapping } from '@/types/data';
import { TableMappingSection } from './DataMappingSection';
import { useComponentStore } from '@/store/componentStore';
import { getComponentMinSize } from '@/utils/componentMinSize';
import {
    AppearanceSection,
    LayoutSections,
    PropertySection,
    PropertySelect,
} from './PropertyFields';

interface TablePropertiesViewProps {
    component: EditorComponent;
    onUpdate: (key: keyof EditorComponent, value: string | number) => void;
    onUpdateProps: (props: Record<string, unknown>) => void;
    onDataSourceChange: (dataSourceId: string) => void;
}

export const TablePropertiesView = ({
    component,
    onUpdate,
    onUpdateProps,
    onDataSourceChange,
}: TablePropertiesViewProps) => {
    const { sources, loadData } = useDataStore();
    const dataSourceId = component.props?.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === dataSourceId);
    const componentDefinition = useComponentStore.getState().getComponentDefinition(component.type);
    const { minWidth, minHeight } = getComponentMinSize(component, componentDefinition);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    const dataSourceOptions = [
        { value: 'none', label: 'Нет данных (ручное заполнение)' },
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
                <TableMappingSection
                    source={source}
                    mappings={(component.props?.columnMappings as TableColumnMapping[] | undefined) ?? []}
                    onChange={(columnMappings) => onUpdateProps({
                        columnMappings,
                        customData: undefined,
                        customColumns: undefined,
                    })}
                    onReload={() => loadData(dataSourceId)}
                />
            )}

            <LayoutSections
                component={component}
                onUpdate={(key, value) => onUpdate(key, value)}
                minWidth={minWidth}
                minHeight={minHeight}
                textAlign={(component.props?.textAlign as string) || 'left'}
                verticalAlign={(component.props?.verticalAlign as string) || 'top'}
                onTextAlignChange={(value) =>
                    onUpdateProps({ ...component.props, textAlign: value })
                }
                onVerticalAlignChange={(value) =>
                    onUpdateProps({ ...component.props, verticalAlign: value })
                }
            />

            <AppearanceSection
                borderRadius={component.borderRadius ?? 4}
                backgroundColor={component.backgroundColor || '#FFFFFF'}
                onBorderRadiusChange={(value) => onUpdate('borderRadius', value)}
                onBackgroundColorChange={(value) => onUpdate('backgroundColor', value)}
            />
        </>
    );
};
