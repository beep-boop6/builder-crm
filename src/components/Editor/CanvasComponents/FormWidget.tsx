import { useCallback, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import { Button, DatePicker, Input, InputNumber, Select, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import type { FormFieldDefinition, FormMode } from '@/types/form';
import {
    getFormFieldsFromProps,
    resolveSearchFormMetrics,
    syncFormComponentHeight,
} from '@/utils/formLayout';
import { FormFieldBlock } from './FormFieldBlock';
import styles from './FormWidget.module.css';

interface FormWidgetProps {
    component: EditorComponent;
}

const stopCanvasBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
};

export const FormWidget = ({ component }: FormWidgetProps) => {
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const updateComponent = useEditorStore((state) => state.updateComponent);
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);

    const props = component.props ?? {};
    const formMode = (props.formMode as FormMode) || 'default';
    const layout = (props.layout as string) || 'vertical';
    const fields = getFormFieldsFromProps(props);
    const submitLabel = String(props.submitLabel ?? 'Отправить');
    const searchFieldKey = String(props.searchFieldKey ?? fields[0]?.name ?? 'text');
    const searchValue = String(props.searchValue ?? '');
    const formValues = (props.formValues as Record<string, string> | undefined) ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];
    const textAlign = (props.textAlign as string) || 'left';
    const editingFieldName = props.editingFieldName as string | undefined;
    const isFormSelected = selectedComponentId === component.id;

    const componentFontFamily = (props.fontFamily as string) || 'Raleway, sans-serif';
    const componentFontSize = component.fontSize ?? 14;

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
        layout,
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

    const notifyIfUnlinked = () => {
        if (targetIds.length === 0) {
            message.warning('Привяжите форму к таблице или графику в панели свойств → «Привязка к данным»');
        }
    };

    const applyToLinkedComponents = () => {
        notifyIfUnlinked();
        patch({
            appliedFormValues: { ...formValues },
            lastAppliedAt: Date.now(),
        });
        if (targetIds.length > 0) {
            message.success('Данные переданы в связанные компоненты');
        }
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
        const searchField = fields.find((field) => field.name === searchFieldKey) ?? fields[0];
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
                                ...(value === '' ? { appliedSearchValue: '' } : {}),
                            });
                        }}
                        onSearch={(value) => {
                            notifyIfUnlinked();
                            patch({
                                searchValue: value,
                                appliedSearchValue: value,
                                lastAppliedAt: Date.now(),
                            });
                            if (targetIds.length > 0 && value.trim()) {
                                message.success('Фильтр применён к связанным компонентам');
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    const isHorizontalLayout = layout === 'horizontal';

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
                <Select
                    size="small"
                    className={styles.fullWidth}
                    style={inputStyle}
                    value={formValues[field.name] || undefined}
                    onChange={(value) => setFieldValue(field.name, value)}
                    options={(field.options ?? []).map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                />
            );
        }
        return null;
    };

    return (
        <div
            className={`${styles.formWidget} ${styles.formWidgetDefault} ${isHorizontalLayout ? styles.horizontal : ''}`}
            style={{
                backgroundColor: component.backgroundColor || '#fff',
                alignItems: isHorizontalLayout ? undefined : flexAlignFromTextAlign(),
                justifyContent: isHorizontalLayout ? flexJustifyFromTextAlign() : undefined,
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
