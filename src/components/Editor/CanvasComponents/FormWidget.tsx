import { useCallback, useEffect, useLayoutEffect, useMemo, type CSSProperties } from 'react';
import { Button, DatePicker, Input, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { useDataStore } from '@/store/dataStore';
import type { FormFieldDefinition, FormLayout, FormMode } from '@/types/form';
import {
    getFormFieldsFromProps,
    resolveSearchFormMetrics,
    syncFormComponentHeight,
} from '@/utils/formLayout';
import type { DataRow } from '@/utils/dataValidation';
import { applyFormSubmissionToTable } from '@/utils/formTableMutation';
import { FormFieldBlock } from './FormFieldBlock';
import styles from './FormWidget.module.css';

interface FormWidgetProps {
    component: EditorComponent;
}

const stopCanvasBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
};

const normalizeFormLayout = (raw: string | undefined): FormLayout => {
    if (raw === 'row') {
        return 'row';
    }
    return 'column';
};

export const FormWidget = ({ component }: FormWidgetProps) => {
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const updateComponent = useEditorStore((state) => state.updateComponent);
    const canvasComponents = useEditorStore((state) => state.components);
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);
    const { sources, loadData } = useDataStore();

    const props = component.props ?? {};
    const formMode = (props.formMode as FormMode) || 'default';
    const layout = normalizeFormLayout(props.layout as string | undefined);
    const fields = getFormFieldsFromProps(props);
    const submitLabel = String(props.submitLabel ?? (layout === 'row' ? 'Добавить строку' : 'Добавить колонку'));
    const searchValue = String(props.searchValue ?? '');
    const formValues = (props.formValues as Record<string, string> | undefined) ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];
    const textAlign = (props.textAlign as string) || 'left';
    const editingFieldName = props.editingFieldName as string | undefined;
    const isFormSelected = selectedComponentId === component.id;

    const componentFontFamily = (props.fontFamily as string) || 'Raleway, sans-serif';
    const componentFontSize = component.fontSize ?? 14;

    const sourceRowsByTableId = useMemo(() => {
        const map: Record<string, DataRow[] | undefined> = {};
        canvasComponents.forEach((item) => {
            if (item.type !== 'table') {
                return;
            }
            const dataSourceId = item.props?.dataSourceId as string | undefined;
            if (!dataSourceId || dataSourceId === 'none') {
                return;
            }
            const source = sources.find((entry) => entry.id === dataSourceId);
            if (source?.data) {
                map[item.id] = source.data;
            }
        });
        return map;
    }, [canvasComponents, sources]);

    useEffect(() => {
        canvasComponents.forEach((item) => {
            if (item.type !== 'table') {
                return;
            }
            const dataSourceId = item.props?.dataSourceId as string | undefined;
            if (!dataSourceId || dataSourceId === 'none') {
                return;
            }
            const source = sources.find((entry) => entry.id === dataSourceId);
            if (source && !source.data && !source.isLoading && !source.error) {
                loadData(dataSourceId);
            }
        });
    }, [canvasComponents, sources, loadData]);

    const flexJustifyFromTextAlign = (): CSSProperties['justifyContent'] => {
        if (textAlign === 'center') return 'center';
        if (textAlign === 'right') return 'flex-end';
        return 'flex-start';
    };

    const flexAlignFromTextAlign = (): CSSProperties['alignItems'] => {
        if (textAlign === 'center') return 'center';
        if (textAlign === 'right') return 'flex-end';
        return 'flex-start';
    };

    const textAlignStyle: CSSProperties = {
        textAlign: textAlign as CSSProperties['textAlign'],
    };

    const patch = (patchProps: Record<string, unknown>) => {
        updateComponentProps(component.id, { ...props, ...patchProps });
    };

    const updateFieldDef = useCallback((fieldName: string, fieldPatch: Partial<FormFieldDefinition>) => {
        const latest =
            useEditorStore.getState().components.find((item) => item.id === component.id) ?? component;
        const latestProps = latest.props ?? {};
        const latestFields = getFormFieldsFromProps(latestProps);
        updateComponentProps(component.id, {
            ...latestProps,
            fields: latestFields.map((item) =>
                item.name === fieldName ? { ...item, ...fieldPatch } : item
            ),
        });
    }, [component, updateComponentProps]);

    useEffect(() => {
        if (!isFormSelected && editingFieldName) {
            const latest =
                useEditorStore.getState().components.find((item) => item.id === component.id) ?? component;
            updateComponentProps(component.id, {
                ...(latest.props ?? {}),
                editingFieldName: undefined,
            });
        }
    }, [component, editingFieldName, isFormSelected, updateComponentProps]);

    useLayoutEffect(() => {
        const latest = useEditorStore.getState().components.find((item) => item.id === component.id) ?? component;
        syncFormComponentHeight(latest, updateComponent, getComponentDefinition('form'));
    }, [
        component.id,
        component.width,
        component.height,
        fields,
        formMode,
        getComponentDefinition,
        updateComponent,
    ]);

    const setFieldValue = (name: string, value: string) => {
        patch({
            formValues: {
                ...formValues,
                [name]: value,
            },
        });
    };

    const applyToLinkedComponents = () => {
        const result = applyFormSubmissionToTable(
            canvasComponents,
            targetIds,
            layout,
            fields,
            formValues,
            sourceRowsByTableId
        );

        if ('error' in result) {
            message.warning(result.error);
            return;
        }

        updateComponentProps(result.tableId, result.patch);
        const clearedValues = Object.fromEntries(
            fields.filter((field) => field.type !== 'submit').map((field) => [field.name, ''])
        );
        patch({ formValues: clearedValues });
        message.success(layout === 'row' ? 'Строка добавлена в таблицу' : 'Колонка добавлена в таблицу');
    };

    const parseDateValue = (raw: string | undefined): Dayjs | null => {
        if (!raw?.trim()) {
            return null;
        }
        const parsed = dayjs(raw);
        return parsed.isValid() ? parsed : null;
    };

    const getFieldInputStyle = (field: FormFieldDefinition): CSSProperties => ({
        fontSize: field.inputFontSize ?? componentFontSize,
        fontFamily: componentFontFamily,
    });

    const getFieldWidthStyle = (field: FormFieldDefinition): CSSProperties =>
        field.fieldWidth
            ? { width: field.fieldWidth, maxWidth: '100%', flex: '0 0 auto' }
            : { width: '100%', maxWidth: '100%' };

    if (formMode === 'search') {
        const searchField = fields[0];
        const metrics = resolveSearchFormMetrics(component.width);

        return (
            <div
                className={styles.formWidgetSearch}
                style={{ backgroundColor: 'transparent' }}
            >
                <div
                    className={styles.searchBarWrap}
                    style={{ width: metrics.barWidth, maxWidth: '100%' }}
                >
                    <Input.Search
                        size="large"
                        allowClear
                        className={styles.searchInput}
                        placeholder={searchField?.placeholder ?? 'Поиск...'}
                        value={searchValue}
                        onMouseDown={stopCanvasBubble}
                        onClick={stopCanvasBubble}
                        onChange={(event) => {
                            const value = event.target.value;
                            patch({
                                searchValue: value,
                                appliedSearchValue: value,
                            });
                        }}
                        onSearch={(value) => {
                            patch({
                                searchValue: value,
                                appliedSearchValue: value,
                            });
                        }}
                    />
                </div>
            </div>
        );
    }

    const renderFieldControl = (field: FormFieldDefinition) => {
        const inputStyle = getFieldInputStyle(field);

        if (field.type === 'text') {
            return (
                <Input
                    size="small"
                    style={inputStyle}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ?? ''}
                    onChange={(event) => setFieldValue(field.name, event.target.value)}
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                />
            );
        }
        if (field.type === 'number') {
            return (
                <InputNumber
                    size="small"
                    className={styles.fullWidth}
                    style={inputStyle}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ? Number(formValues[field.name]) : undefined}
                    onChange={(value) =>
                        setFieldValue(
                            field.name,
                            value === null || value === undefined ? '' : String(value)
                        )
                    }
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                />
            );
        }
        if (field.type === 'date') {
            return (
                <DatePicker
                    size="small"
                    className={styles.fullWidth}
                    style={inputStyle}
                    value={parseDateValue(formValues[field.name])}
                    onChange={(_date: Dayjs | null, dateString) =>
                        setFieldValue(
                            field.name,
                            Array.isArray(dateString) ? dateString[0] : dateString
                        )
                    }
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                />
            );
        }
        if (field.type === 'select') {
            return (
                <Input
                    size="small"
                    style={inputStyle}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ?? ''}
                    onChange={(event) => setFieldValue(field.name, event.target.value)}
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                />
            );
        }
        return null;
    };

    return (
        <div
            className={`${styles.formWidget} ${styles.formWidgetDefault}`}
            style={{
                backgroundColor: component.backgroundColor || '#fff',
                alignItems: flexAlignFromTextAlign(),
            }}
        >
            {fields
                .filter((field) => field.type !== 'submit')
                .map((field) => (
                    <FormFieldBlock
                        key={field.name}
                        field={field}
                        isFormSelected={isFormSelected}
                        isEditing={editingFieldName === field.name}
                        textAlignStyle={textAlignStyle}
                        inputFontStyle={getFieldInputStyle(field)}
                        fieldWidthStyle={getFieldWidthStyle(field)}
                        onBeginEdit={() => patch({ editingFieldName: field.name })}
                        onEndEdit={() => patch({ editingFieldName: undefined })}
                        onUpdateField={(fieldPatch) => updateFieldDef(field.name, fieldPatch)}
                    >
                        {renderFieldControl(field)}
                    </FormFieldBlock>
                ))}
            <div
                className={styles.submitRow}
                style={{ display: 'flex', justifyContent: flexJustifyFromTextAlign() }}
            >
                <Button
                    type="primary"
                    size="small"
                    onClick={applyToLinkedComponents}
                    onMouseDown={stopCanvasBubble}
                >
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};
