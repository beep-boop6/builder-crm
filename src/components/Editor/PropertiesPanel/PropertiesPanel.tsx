import { useState } from 'react';
import { message } from 'antd';
import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import { useComponentStore } from '@/store/componentStore';
import { useReusablePresetStore } from '@/store/reusablePresetStore';
import { buildDefaultTableMappings } from '@/utils/dataMapping';
import { SavePresetModal } from './SavePresetModal';
import { TablePropertiesView } from './TablePropertiesView';
import { ChartPropertiesView } from './ChartPropertiesView';
import { CardPropertiesView } from './CardPropertiesView';
import {
    AppearanceSection,
    LayoutSections,
    PropertyPanelHeader,
    PropertySection,
    PropertySelect,
    PropertyTextInput,
    TypographySection,
} from './PropertyFields';
import { getComponentMinSize } from '@/utils/componentMinSize';
import styles from './PropertiesPanel.module.css';

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
    const { minWidth, minHeight } = getComponentMinSize(selectedComponent, componentDefinition);
    const defaultPresetCategory = componentDefinition?.category ?? 'custom';

    const handleUpdate = (key: keyof EditorComponent, value: string | number) => {
        updateComponent(selectedComponent.id, { [key]: value });
    };

    const handleUpdateProp = (key: string, value: unknown) => {
        updateComponentProps(selectedComponent.id, {
            ...selectedComponent.props,
            [key]: value,
        });
    };

    const handleSavePreset = (values: { name: string; category: string }) => {
        const { id: _id, x: _x, y: _y, ...snapshot } = selectedComponent;
        savePreset(values.name, snapshot, values.category);
        message.success('Шаблон сохранён в библиотеке');
        setIsSaveModalOpen(false);
    };

    const handleDuplicate = () => {
        duplicateComponent(selectedComponent.id);
    };

    const handleDelete = () => {
        if (window.confirm('Удалить выбранный компонент?')) {
            deleteComponent(selectedComponent.id);
            clearSelection();
        }
    };

    const handleDataSourceChange = async (dataSourceId: string, componentType: 'table' | 'chart') => {
        updateComponentProps(selectedComponent.id, {
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

        if (componentType === 'table') {
            updateComponentProps(selectedComponent.id, {
                columnMappings: buildDefaultTableMappings(source.data),
            });
            return;
        }

        const fields = source.fields;
        updateComponentProps(selectedComponent.id, {
            chartMapping: {
                xField: fields[0] ?? '',
                yField: fields[1] ?? fields[0] ?? '',
            },
            xAxisKey: fields[0] ?? '',
            yAxisKey: fields[1] ?? fields[0] ?? '',
        });
    };

    const renderTypeSpecificSections = () => {
        const props = selectedComponent.props ?? {};

        if (selectedComponent.type === 'form') {
            return (
                <PropertySection title="Контент">
                    <PropertySelect
                        value={(props.layout as string) || 'vertical'}
                        onChange={(event) => handleUpdateProp('layout', event.target.value)}
                        options={[
                            { value: 'vertical', label: 'Вертикальная раскладка' },
                            { value: 'horizontal', label: 'Горизонтальная раскладка' },
                        ]}
                    />
                </PropertySection>
            );
        }

        if (selectedComponent.type === 'filter') {
            return (
                <>
                    <PropertySection title="Контент">
                        <PropertySelect
                            value={(props.filterType as string) || 'date'}
                            onChange={(event) => handleUpdateProp('filterType', event.target.value)}
                            options={[
                                { value: 'date', label: 'Дата' },
                                { value: 'select', label: 'Выпадающий список' },
                                { value: 'text', label: 'Текстовый ввод' },
                            ]}
                        />
                        <PropertyTextInput
                            value={(props.placeholder as string) ?? ''}
                            placeholder="Подсказка в поле"
                            onChange={(event) => handleUpdateProp('placeholder', event.target.value)}
                        />
                    </PropertySection>
                    <PropertySection title="Поведение">
                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={Boolean(props.multiSelect)}
                                onChange={(event) => handleUpdateProp('multiSelect', event.target.checked)}
                            />
                            <span className={styles.checkboxLabel}>Множественный выбор</span>
                        </label>
                    </PropertySection>
                </>
            );
        }

        if (selectedComponent.type === 'button') {
            return (
                <PropertySection title="Контент">
                    <PropertyTextInput
                        value={selectedComponent.text}
                        placeholder="Текст кнопки"
                        onChange={(event) => handleUpdate('text', event.target.value)}
                    />
                    <PropertySelect
                        value={(props.variant as string) || 'primary'}
                        onChange={(event) => handleUpdateProp('variant', event.target.value)}
                        options={[
                            { value: 'primary', label: 'Основная' },
                            { value: 'default', label: 'Обычная' },
                            { value: 'dashed', label: 'Пунктирная' },
                        ]}
                    />
                    <PropertySelect
                        value={(props.size as string) || 'middle'}
                        onChange={(event) => handleUpdateProp('size', event.target.value)}
                        options={[
                            { value: 'small', label: 'Маленькая' },
                            { value: 'middle', label: 'Средняя' },
                            { value: 'large', label: 'Большая' },
                        ]}
                    />
                </PropertySection>
            );
        }

        return (
            <PropertySection title="Контент">
                <PropertyTextInput
                    value={selectedComponent.text}
                    placeholder="Текст компонента"
                    onChange={(event) => handleUpdate('text', event.target.value)}
                />
            </PropertySection>
        );
    };

    const renderPanelBody = () => {
        if (selectedComponent.type === 'table') {
            return (
                <TablePropertiesView
                    component={selectedComponent}
                    onUpdate={handleUpdate}
                    onUpdateProps={(props) => updateComponentProps(selectedComponent.id, props)}
                    onDataSourceChange={(id) => handleDataSourceChange(id, 'table')}
                />
            );
        }

        if (selectedComponent.type === 'chart') {
            return (
                <ChartPropertiesView
                    component={selectedComponent}
                    onUpdate={handleUpdate}
                    onUpdateProps={(props) => updateComponentProps(selectedComponent.id, props)}
                    onDataSourceChange={(id) => handleDataSourceChange(id, 'chart')}
                />
            );
        }

        if (selectedComponent.type === 'card') {
            return (
                <CardPropertiesView
                    component={selectedComponent}
                    onUpdate={handleUpdate}
                    onUpdateProps={(props) => updateComponentProps(selectedComponent.id, props)}
                />
            );
        }

        return (
            <>
                {renderTypeSpecificSections()}
                <LayoutSections
                    component={selectedComponent}
                    onUpdate={handleUpdate}
                    minWidth={minWidth}
                    minHeight={minHeight}
                />
                <AppearanceSection
                    borderRadius={selectedComponent.borderRadius ?? 4}
                    backgroundColor={selectedComponent.backgroundColor || '#FFFFFF'}
                    onBorderRadiusChange={(value) => handleUpdate('borderRadius', value)}
                    onBackgroundColorChange={(value) => handleUpdate('backgroundColor', value)}
                />
                <TypographySection
                    fontSize={selectedComponent.fontSize ?? 14}
                    color={selectedComponent.color || '#333333'}
                    onFontSizeChange={(value) => handleUpdate('fontSize', value)}
                    onColorChange={(value) => handleUpdate('color', value)}
                />
            </>
        );
    };

    return (
        <div className={styles.propertiesPanel}>
            <PropertyPanelHeader
                subtitle={componentLabel}
                showToolbar
                onSavePreset={() => setIsSaveModalOpen(true)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
            />
            <div className={styles.content}>
                {renderPanelBody()}
            </div>
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
