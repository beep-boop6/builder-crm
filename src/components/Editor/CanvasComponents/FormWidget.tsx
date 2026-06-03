import { useEffect, useLayoutEffect, useRef } from 'react';
import { Button, DatePicker, Input, InputNumber, Select, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { useDataStore } from '@/store/dataStore';
import type { FormFieldDefinition, FormMode, SearchBackgroundMode } from '@/types/form';
import {
    getFormFieldsFromProps,
    getSearchBarDisplayWidth,
    syncFormComponentHeight,
} from '@/utils/formLayout';
import type { DataRow } from '@/utils/dataValidation';
import styles from './FormWidget.module.css';

interface FormWidgetProps {
    component: EditorComponent;
}

const buildValuesFromDataRow = (
    fields: FormFieldDefinition[],
    row: DataRow,
    current: Record<string, string>
): Record<string, string> => {
    const next = { ...current };
    fields.forEach((field) => {
        if (field.type === 'submit') {
            return;
        }
        const raw = row[field.name];
        if (raw === null || raw === undefined) {
            return;
        }
        if (!current[field.name]?.trim()) {
            next[field.name] = String(raw);
        }
    });
    return next;
};

export const FormWidget = ({ component }: FormWidgetProps) => {
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const updateComponent = useEditorStore((state) => state.updateComponent);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);
    const dataPrefilledRef = useRef<string | null>(null);

    const props = component.props ?? {};
    const formMode = (props.formMode as FormMode) || 'default';
    const layout = (props.layout as string) || 'vertical';
    const fields = getFormFieldsFromProps(props);
    const submitLabel = String(props.submitLabel ?? 'Отправить');
    const searchFieldKey = String(props.searchFieldKey ?? fields[0]?.name ?? 'text');
    const searchValue = String(props.searchValue ?? '');
    const formValues = (props.formValues as Record<string, string> | undefined) ?? {};
    const targetIds = (props.targetComponentIds as string[] | undefined) ?? [];
    const dataSourceId = String(props.dataSourceId ?? 'none');

    const { sources, loadData } = useDataStore();
    const source = sources.find((item) => item.id === dataSourceId);

    const patch = (patchProps: Record<string, unknown>) => {
        updateComponentProps(component.id, { ...props, ...patchProps });
    };

    useLayoutEffect(() => {
        const latest = useEditorStore.getState().components.find((item) => item.id === component.id) ?? component;
        syncFormComponentHeight(latest, updateComponent, getComponentDefinition('form'));
    }, [
        component.id,
        component.width,
        fields.length,
        formMode,
        layout,
        getComponentDefinition,
        updateComponent,
    ]);

    useEffect(() => {
        if (dataSourceId === 'none' || !source) {
            return;
        }
        if (!source.data && !source.isLoading && !source.error) {
            void loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    useEffect(() => {
        if (dataSourceId === 'none' || !source?.data?.length) {
            dataPrefilledRef.current = null;
            return;
        }
        const cacheKey = `${dataSourceId}:${source.lastLoadedAt ?? source.data.length}`;
        if (dataPrefilledRef.current === cacheKey) {
            return;
        }
        dataPrefilledRef.current = cacheKey;
        const row = source.data[0];
        const currentValues = (component.props?.formValues as Record<string, string> | undefined) ?? {};
        const merged = buildValuesFromDataRow(fields, row, currentValues);
        const changed = fields.some((field) => merged[field.name] !== currentValues[field.name]);
        if (changed) {
            updateComponentProps(component.id, {
                ...component.props,
                formValues: merged,
            });
        }
    }, [component.id, component.props, dataSourceId, fields, source?.data, source?.lastLoadedAt, updateComponentProps]);

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

    if (formMode === 'search') {
        const searchField = fields.find((field) => field.name === searchFieldKey) ?? fields[0];
        const searchBackground = (props.searchBackground as SearchBackgroundMode) || 'fill';
        const fillArea = searchBackground === 'fill';
        const barWidth = getSearchBarDisplayWidth(component.width, props);

        return (
            <div
                className={`${styles.formWidgetSearch} ${fillArea ? styles.formWidgetSearchFill : styles.formWidgetSearchTransparent}`}
                style={fillArea ? { backgroundColor: component.backgroundColor || '#ffffff' } : undefined}
            >
                <div className={styles.searchBarWrap} style={{ width: barWidth, maxWidth: '100%' }}>
                    <Input.Search
                        size="large"
                        allowClear
                        className={styles.searchInput}
                        placeholder={searchField?.placeholder ?? 'Поиск...'}
                        value={searchValue}
                        onChange={(event) => patch({ searchValue: event.target.value })}
                        onSearch={(value) => {
                            notifyIfUnlinked();
                            patch({ searchValue: value });
                        }}
                    />
                </div>
            </div>
        );
    }

        return (
        <div
            className={`${styles.formWidget} ${styles.formWidgetDefault} ${layout === 'horizontal' ? styles.horizontal : ''}`}
            style={{ backgroundColor: component.backgroundColor || '#fff' }}
        >
            {fields
                .filter((field) => field.type !== 'submit')
                .map((field) => (
                    <div key={field.name} className={styles.field}>
                        <label className={styles.fieldLabel}>
                            {field.label}
                            {field.required ? ' *' : ''}
                        </label>
                        {field.type === 'text' ? (
                            <Input
                                size="small"
                                placeholder={field.placeholder}
                                value={formValues[field.name] ?? ''}
                                onChange={(event) => setFieldValue(field.name, event.target.value)}
                            />
                        ) : null}
                        {field.type === 'number' ? (
                            <InputNumber
                                size="small"
                                className={styles.fullWidth}
                                placeholder={field.placeholder}
                                value={formValues[field.name] ? Number(formValues[field.name]) : undefined}
                                onChange={(value) =>
                                    setFieldValue(
                                        field.name,
                                        value === null || value === undefined ? '' : String(value)
                                    )
                                }
                            />
                        ) : null}
                        {field.type === 'date' ? (
                            <DatePicker
                                size="small"
                                className={styles.fullWidth}
                                value={parseDateValue(formValues[field.name])}
                                onChange={(_date: Dayjs | null, dateString) =>
                                    setFieldValue(
                                        field.name,
                                        Array.isArray(dateString) ? dateString[0] : dateString
                                    )
                                }
                            />
                        ) : null}
                        {field.type === 'select' ? (
                            <Select
                                size="small"
                                className={styles.fullWidth}
                                value={formValues[field.name] || undefined}
                                onChange={(value) => setFieldValue(field.name, value)}
                                options={(field.options ?? []).map((option) => ({
                                    value: option,
                                    label: option,
                                }))}
                            />
                        ) : null}
                    </div>
                ))}
            <div className={styles.submitRow}>
                <Button type="primary" size="small" onClick={applyToLinkedComponents}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};
