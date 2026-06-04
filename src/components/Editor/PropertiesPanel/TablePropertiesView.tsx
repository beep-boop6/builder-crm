import { useEffect } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import type { TableColumnMapping } from '@/types/data';
import { TableMappingSection } from './DataMappingSection';
import { PropertySection, PropertySelect } from './PropertyFields';

interface TablePropertiesViewProps {
    component: EditorComponent;
    onUpdateProps: (props: Record<string, unknown>) => void;
    onDataSourceChange: (dataSourceId: string) => void;
}

export const TablePropertiesView = ({
    component,
    onUpdateProps,
    onDataSourceChange,
}: TablePropertiesViewProps) => {
    const { sources, loadData } = useDataStore();
    const dataSourceId = component.props?.dataSourceId as string | undefined;
    const source = sources.find((item) => item.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    const dataSourceOptions = [
        { value: 'none', label: '— Ручное заполнение —' },
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
                    onChange={(columnMappings) =>
                        onUpdateProps({ ...component.props, columnMappings })
                    }
                    onReload={() => loadData(dataSourceId)}
                />
            )}
        </>
    );
};
