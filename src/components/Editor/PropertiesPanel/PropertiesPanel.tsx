import { useState } from 'react';
import { message } from 'antd';
import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import { useComponentStore } from '@/store/componentStore';
import { applyTableMapping, buildDefaultTableMappings, ensureTableRowIds } from '@/utils/dataMapping';
import type { DataRow } from '@/utils/dataValidation';
import { useReusablePresetStore } from '@/store/reusablePresetStore';
import { isCardComponentType } from '@/utils/componentFilters';
import { SavePresetModal } from './SavePresetModal';
import { TablePropertiesView } from './TablePropertiesView';
import { ChartPropertiesView } from './ChartPropertiesView';
import { CardPropertiesView } from './CardPropertiesView';
import { FormPropertiesView } from './FormPropertiesView';
import { FilterPropertiesView } from './FilterPropertiesView';
import { CardVariantPropertiesView } from './CardVariantPropertiesView';
import {
    BehaviorSection,
    BorderSection,
    LayoutSections,
    PropertyPanelHeader,
    TextSection,
} from './PropertyFields';
import { getComponentResizeBounds } from '@/utils/formResize';
import { isFormSearchMode, SEARCH_FORM_BORDER_RADIUS } from '@/utils/formLayout';
import { getAdaptivePalette } from '@/utils/colorContrast';
import styles from './PropertiesPanel.module.css';

const getBehaviorProps = (props: Record<string, unknown> | undefined) => ({
    visible: props?.visible !== false,
    locked: Boolean(props?.locked),
    opacity: typeof props?.opacity === 'number' ? props.opacity : 1,
    borderColor: String(props?.borderColor ?? '#E8E8E8'),
    borderWidth: typeof props?.borderWidth === 'number' ? props.borderWidth : 0,
    borderEnabled: typeof props?.borderWidth === 'number' ? props.borderWidth > 0 : false,
});

export const PropertiesPanel = () => {
    const {
        selectedComponentId,
        components,
        updateComponent,
        updateComponentProps,
        deleteComponent,
        duplicateComponent,
        clearSelection,
    } = useEditorStore();
    const { loadData } = useDataStore();
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);
    const savePreset = useReusablePresetStore((state) => state.savePreset);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const selectedComponent = components.find((c) => c.id === selectedComponentId);

    if (!selectedComponent) {
        return (
            <div className={styles.propertiesPanel}>
                <PropertyPanelHeader />
                <div className={styles.emptyState}>
                    <p className={styles.emptyStateTitle}>Компонент не выбран</p>
                    <p className={styles.emptyStateText}>
                        Выберите элемент на холсте, чтобы редактировать его параметры
                    </p>
                </div>
            </div>
        );
    }

    const componentDefinition = getComponentDefinition(selectedComponent.type);
    const componentLabel = componentDefinition?.name ?? selectedComponent.type;
    const resizeBounds = getComponentResizeBounds(selectedComponent, componentDefinition);
    const defaultPresetCategory = componentDefinition?.category ?? 'custom';
    const props = selectedComponent.props ?? {};
    const behavior = getBehaviorProps(props);
    const isSearchForm = selectedComponent.type === 'form' && isFormSearchMode(props);

    const handleUpdate = (key: keyof EditorComponent, value: string | number) => {
        if (key === 'width' && isSearchForm) {
            const next = Math.max(resizeBounds.minWidth, Number(value));
            updateComponent(selectedComponent.id, { width: next });
            return;
        }
        if (key === 'height' && resizeBounds.lockHeight) {
            return;
        }
        updateComponent(selectedComponent.id, { [key]: value });
    };

    const handleUpdateProp = (patch: Record<string, unknown>) => {
        updateComponentProps(selectedComponent.id, {
            ...props,
            ...patch,
        });
    };

    const handleDataSourceChange = async (dataSourceId: string, componentType: 'table' | 'chart') => {
        updateComponentProps(selectedComponent.id, {
            ...props,
            dataSourceId,
            customData: undefined,
            customColumns: undefined,
            columnMappings: undefined,
            chartMapping: undefined,
            xAxisKey: undefined,
            yAxisKey: undefined,
            dataValidationError: null,
        });

        if (dataSourceId === 'none') {
            return;
        }

        await loadData(dataSourceId);
        const source = useDataStore.getState().getSourceById(dataSourceId);
        if (!source?.data || source.error) {
            return;
        }

        const latestProps =
            useEditorStore.getState().components.find((c) => c.id === selectedComponent.id)?.props
            ?? props;

        if (componentType === 'table') {
            const columnMappings = buildDefaultTableMappings(source.data);
            const mapped = applyTableMapping(source.data, columnMappings);
            updateComponentProps(selectedComponent.id, {
                ...latestProps,
                dataSourceId,
                columnMappings,
                customColumns: mapped.columns,
                customData: ensureTableRowIds(mapped.data as DataRow[]),
            });
            return;
        }

        const fields = source.fields;
        updateComponentProps(selectedComponent.id, {
            ...latestProps,
            dataSourceId,
            chartMapping: {
                xField: fields[0] ?? '',
                yField: fields[1] ?? fields[0] ?? '',
            },
            xAxisKey: fields[0] ?? '',
            yAxisKey: fields[1] ?? fields[0] ?? '',
        });
    };

    const handleSavePreset = (values: { name: string; category: string }) => {
        const { id: _id, x: _x, y: _y, ...snapshot } = selectedComponent;
        savePreset(values.name, snapshot, values.category);
        message.success('Шаблон сохранён в библиотеке');
        setIsSaveModalOpen(false);
    };

    const alignmentFlags = (() => {
        const type = selectedComponent.type;
        if (type === 'card-deal' || type === 'card-summary') {
            return { hideHorizontalAlign: false, hideVerticalAlign: true };
        }
        if (type === 'form') {
            if (isSearchForm) {
                return { hideAlignment: true };
            }
            return { hideHorizontalAlign: false, hideVerticalAlign: true };
        }
        return { hideHorizontalAlign: false, hideVerticalAlign: false };
    })();

    const renderCommonSections = () => (
        <>
            <LayoutSections
                component={selectedComponent}
                onUpdate={handleUpdate}
                minWidth={resizeBounds.minWidth}
                minHeight={resizeBounds.minHeight}
                maxWidth={resizeBounds.maxWidth}
                maxHeight={resizeBounds.maxHeight}
                lockHeight={resizeBounds.lockHeight}
                opacity={behavior.opacity}
                textAlign={(props.textAlign as string) || 'left'}
                verticalAlign={(props.verticalAlign as string) || 'top'}
                onOpacityChange={(value) => handleUpdateProp({ opacity: value })}
                onTextAlignChange={(value) => handleUpdateProp({ textAlign: value })}
                onVerticalAlignChange={(value) => handleUpdateProp({ verticalAlign: value })}
                {...alignmentFlags}
            />
            <BorderSection
                enabled={behavior.borderEnabled}
                borderColor={behavior.borderColor}
                borderWidth={behavior.borderWidth}
                backgroundColor={selectedComponent.backgroundColor || '#FFFFFF'}
                borderRadius={
                    isSearchForm
                        ? (selectedComponent.borderRadius ?? SEARCH_FORM_BORDER_RADIUS)
                        : (selectedComponent.borderRadius ?? 12)
                }
                hideBackgroundColor={isSearchForm}
                onEnabledChange={(enabled) =>
                    handleUpdateProp({
                        borderWidth: enabled ? (behavior.borderWidth > 0 ? behavior.borderWidth : 1) : 0,
                    })
                }
                onBorderColorChange={(value) => handleUpdateProp({ borderColor: value })}
                onBorderWidthChange={(value) => handleUpdateProp({ borderWidth: value })}
                onBackgroundColorChange={(value) => {
                    handleUpdate('backgroundColor', value);
                    if (selectedComponent.type === 'card') {
                        handleUpdate('color', getAdaptivePalette(value).text);
                    }
                }}
                onBorderRadiusChange={(value) => handleUpdate('borderRadius', value)}
            />
            <TextSection
                fontFamily={(props.fontFamily as string) || 'Raleway'}
                fontSize={selectedComponent.fontSize ?? 14}
                fontWeight={selectedComponent.fontWeight ?? 400}
                color={selectedComponent.color || '#000000'}
                onFontFamilyChange={(value) => handleUpdateProp({ fontFamily: value })}
                onFontSizeChange={(value) => handleUpdate('fontSize', value)}
                onFontWeightChange={(value) => updateComponent(selectedComponent.id, { fontWeight: value })}
                onColorChange={(value) => handleUpdate('color', value)}
            />
            <BehaviorSection
                visible={behavior.visible}
                locked={behavior.locked}
                onVisibleChange={(value) => handleUpdateProp({ visible: value })}
                onLockedChange={(value) => handleUpdateProp({ locked: value })}
            />
        </>
    );

    const renderPanelBody = () => {
        if (selectedComponent.type === 'table') {
            return (
                <>
                    <TablePropertiesView
                        component={selectedComponent}
                        onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                        onDataSourceChange={(id) => handleDataSourceChange(id, 'table')}
                    />
                    {renderCommonSections()}
                </>
            );
        }

        if (selectedComponent.type === 'chart') {
            return (
                <ChartPropertiesView
                    component={selectedComponent}
                    onUpdate={handleUpdate}
                    onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                    onDataSourceChange={(id) => handleDataSourceChange(id, 'chart')}
                />
            );
        }

        if (selectedComponent.type === 'card') {
            return (
                <>
                    <CardPropertiesView
                        component={selectedComponent}
                        onUpdate={handleUpdate}
                        onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                    />
                    {renderCommonSections()}
                </>
            );
        }

        if (isCardComponentType(selectedComponent.type) && selectedComponent.type !== 'card') {
            return (
                <>
                    <CardVariantPropertiesView
                        component={selectedComponent}
                        onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                    />
                    {renderCommonSections()}
                </>
            );
        }

        if (selectedComponent.type === 'form') {
            return (
                <>
                    <FormPropertiesView
                        component={selectedComponent}
                        onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                    />
                    {renderCommonSections()}
                </>
            );
        }

        if (selectedComponent.type === 'filter') {
            return (
                <>
                    <FilterPropertiesView
                        component={selectedComponent}
                        onUpdateProps={(nextProps) => updateComponentProps(selectedComponent.id, nextProps)}
                    />
                    {renderCommonSections()}
                </>
            );
        }

        return renderCommonSections();
    };

    return (
        <div className={styles.propertiesPanel}>
            <PropertyPanelHeader
                subtitle={componentLabel}
                showToolbar
                onSavePreset={() => setIsSaveModalOpen(true)}
                onDuplicate={() => duplicateComponent(selectedComponent.id)}
                onDelete={() => {
                    if (window.confirm('Удалить выбранный компонент?')) {
                        deleteComponent(selectedComponent.id);
                        clearSelection();
                    }
                }}
            />
            <div className={styles.content}>{renderPanelBody()}</div>
            <SavePresetModal
                open={isSaveModalOpen}
                defaultName={selectedComponent.text || selectedComponent.type}
                defaultCategory={defaultPresetCategory}
                onCancel={() => setIsSaveModalOpen(false)}
                onSubmit={handleSavePreset}
            />
        </div>
    );
};
