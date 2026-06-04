import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import type { FormFieldDefinition, FormMode } from '@/types/form';
import {
    clampSearchFormDimensions,
    getFormFieldsFromProps,
    MAX_FORM_FIELD_WIDTH,
    MIN_FORM_FIELD_WIDTH,
    SEARCH_FORM_BORDER_RADIUS,
    syncFormComponentHeight,
    TZ_DEFAULT_FORM_FIELDS,
} from '@/utils/formLayout';
import { ComponentTargetsSection } from './ComponentTargetsSection';
import {
    PropertySection,
    PropertySelect,
    PropertyTextInput,
    PropertyButton,
} from './PropertyFields';
import styles from './PropertiesPanel.module.css';

interface Props {
    component: EditorComponent;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

const FIELD_TYPE_OPTIONS = [
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'select', label: 'Список' },
];

export const FormPropertiesView = ({ component, onUpdateProps }: Props) => {
    const updateComponent = useEditorStore((state) => state.updateComponent);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);

    const props = component.props ?? {};
    const fields = getFormFieldsFromProps(props);
    const editingFieldName = props.editingFieldName as string | undefined;
    const editingFieldIndex = editingFieldName
        ? fields.findIndex((field) => field.name === editingFieldName)
        : -1;
    const editingField = editingFieldIndex >= 0 ? fields[editingFieldIndex] : undefined;

    const applyPatch = (patchProps: Record<string, unknown>) => {
        const nextProps = { ...props, ...patchProps };
        onUpdateProps(nextProps);
        const nextComponent: EditorComponent = { ...component, props: nextProps };
        syncFormComponentHeight(nextComponent, updateComponent, getComponentDefinition('form'));
    };

    const updateField = (index: number, updates: Partial<FormFieldDefinition>) => {
        const next = fields.map((field, fieldIndex) =>
            fieldIndex === index ? { ...field, ...updates } : field
        );
        applyPatch({ fields: next });
    };

    const addField = (type: FormFieldDefinition['type']) => {
        const index = fields.length + 1;
        applyPatch({
            fields: [
                ...fields,
                {
                    name: `field${index}`,
                    label: `Поле ${index}`,
                    type,
                    placeholder: '',
                },
            ],
        });
    };

    const removeField = (index: number) => {
        applyPatch({ fields: fields.filter((_, fieldIndex) => fieldIndex !== index) });
    };

    const resetToTzFields = () => {
        applyPatch({ fields: structuredClone(TZ_DEFAULT_FORM_FIELDS) });
    };

    return (
        <>
            <PropertySection title="Режим формы">
                <PropertySelect
                    value={(props.formMode as FormMode) || 'default'}
                    onChange={(event) => {
                        const mode = event.target.value;
                        if (mode === 'search') {
                            const { width, height } = clampSearchFormDimensions(component.width);
                            const borderWidth =
                                typeof props.borderWidth === 'number' ? props.borderWidth : 0;
                            applyPatch({
                                formMode: mode,
                                ...(borderWidth <= 0 ? { borderWidth: 1 } : {}),
                            });
                            updateComponent(component.id, {
                                width,
                                height,
                                borderRadius: component.borderRadius ?? SEARCH_FORM_BORDER_RADIUS,
                                backgroundColor: 'transparent',
                            });
                            return;
                        }
                        applyPatch({ formMode: mode });
                    }}
                    options={[
                        { value: 'default', label: 'Форма (поля + отправка)' },
                        { value: 'search', label: 'Поиск (строка)' },
                    ]}
                />
            </PropertySection>

            {props.formMode === 'search' ? (
                <>
                    <PropertySection title="Строка поиска">
                        <PropertySelect
                            value={String(props.searchFieldKey ?? fields[0]?.name ?? 'text')}
                            onChange={(event) => applyPatch({ searchFieldKey: event.target.value })}
                            options={fields.map((field) => ({
                                value: field.name,
                                label: field.label,
                            }))}
                        />
                        <PropertyTextInput
                            value={String(
                                fields.find((f) => f.name === (props.searchFieldKey ?? fields[0]?.name))?.placeholder
                                    ?? 'Поиск...'
                            )}
                            placeholder="Подсказка в поле"
                            onChange={(event) => {
                                const key = String(props.searchFieldKey ?? fields[0]?.name ?? 'text');
                                const next = fields.map((field) =>
                                    field.name === key
                                        ? { ...field, placeholder: event.target.value }
                                        : field
                                );
                                applyPatch({ fields: next });
                            }}
                        />
                        <p className={styles.hintText}>
                            Ключ поля (name) должен совпадать с колонкой таблицы/графика (например title, client, name).
                            Фильтр срабатывает по Enter или кнопке лупы. Ширина — синей ручкой на холсте.
                        </p>
                    </PropertySection>
                </>
            ) : (
                <>
                    <PropertySection title="Раскладка">
                        <PropertySelect
                            value={(props.layout as string) || 'vertical'}
                            onChange={(event) => applyPatch({ layout: event.target.value })}
                            options={[
                                { value: 'vertical', label: 'Вертикальная' },
                                { value: 'horizontal', label: 'Горизонтальная' },
                            ]}
                        />
                    </PropertySection>
                    <PropertySection
                        title="Поля формы"
                        action={
                            <PropertyButton onClick={() => addField('text')}>+ Поле</PropertyButton>
                        }
                    >
                        <PropertyButton variant="ghost" onClick={resetToTzFields}>
                            Стандартный набор (ТЗ)
                        </PropertyButton>
                        {fields.map((field, index) => (
                            <div key={`${field.name}-${index}`} style={{ marginBottom: 12 }}>
                                <PropertyTextInput
                                    value={field.label}
                                    placeholder="Подпись"
                                    onChange={(event) => updateField(index, { label: event.target.value })}
                                />
                                <PropertyTextInput
                                    value={field.name}
                                    placeholder="Ключ поля (для данных)"
                                    onChange={(event) => updateField(index, { name: event.target.value })}
                                />
                                <PropertySelect
                                    value={field.type}
                                    onChange={(event) =>
                                        updateField(index, {
                                            type: event.target.value as FormFieldDefinition['type'],
                                        })
                                    }
                                    options={FIELD_TYPE_OPTIONS}
                                />
                                <PropertyButton variant="danger" onClick={() => removeField(index)}>
                                    Удалить поле
                                </PropertyButton>
                            </div>
                        ))}
                    </PropertySection>
                    <PropertySection title="Кнопка отправки">
                        <PropertyTextInput
                            value={String(props.submitLabel ?? 'Отправить')}
                            onChange={(event) => applyPatch({ submitLabel: event.target.value })}
                        />
                    </PropertySection>

                    {editingField ? (
                        <PropertySection title={`Поле: ${editingField.label}`}>
                            <PropertyTextInput
                                value={String(editingField.fieldWidth ?? '')}
                                placeholder={`Ширина (${MIN_FORM_FIELD_WIDTH}–${MAX_FORM_FIELD_WIDTH})`}
                                onChange={(event) => {
                                    const raw = event.target.value.trim();
                                    updateField(editingFieldIndex, {
                                        fieldWidth: raw ? Number(raw) : undefined,
                                    });
                                }}
                            />
                            <PropertyTextInput
                                value={String(editingField.inputFontSize ?? component.fontSize ?? 14)}
                                placeholder="Размер шрифта ввода"
                                onChange={(event) => {
                                    const size = Number(event.target.value);
                                    if (!Number.isFinite(size)) {
                                        return;
                                    }
                                    updateField(editingFieldIndex, {
                                        inputFontSize: Math.min(32, Math.max(10, size)),
                                    });
                                }}
                            />
                            <p className={styles.hintText}>
                                На холсте: двойной клик по полю — режим правки, перетащите синюю полоску справа
                                для ширины.
                            </p>
                        </PropertySection>
                    ) : (
                        <p className={styles.hintText}>
                            Двойной клик по полю на холсте — изменить ширину и шрифт ввода.
                        </p>
                    )}
                </>
            )}

            <p className={styles.hintText}>
                {props.formMode === 'search'
                    ? 'В «Привязка к данным» отметьте таблицу/график. Поиск фильтрует строки по подстроке в выбранной колонке.'
                    : 'Ключи полей (name) должны совпадать с колонками источника. «Отправить» применяет фильтр к привязанным таблице и графику.'}
            </p>

            <ComponentTargetsSection
                excludeComponentId={component.id}
                targetComponentIds={(props.targetComponentIds as string[]) ?? []}
                onChange={(ids) => applyPatch({ targetComponentIds: ids })}
            />
        </>
    );
};
