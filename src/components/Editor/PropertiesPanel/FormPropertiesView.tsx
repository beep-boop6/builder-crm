import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import type { FormFieldDefinition, FormLayout, FormMode } from '@/types/form';
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
];

const normalizeFormLayout = (raw: string | undefined): FormLayout =>
    raw === 'row' ? 'row' : 'column';

export const FormPropertiesView = ({ component, onUpdateProps }: Props) => {
    const updateComponent = useEditorStore((state) => state.updateComponent);
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);

    const props = component.props ?? {};
    const layout = normalizeFormLayout(props.layout as string | undefined);
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

    const addValueField = () => {
        const index = fields.filter((field) => field.type !== 'submit').length;
        applyPatch({
            fields: [
                ...fields,
                {
                    name: `value${index}`,
                    label: 'Значение',
                    type: 'text',
                    placeholder: '',
                },
            ],
        });
    };

    const removeField = (index: number) => {
        if (index === 0) {
            return;
        }
        applyPatch({ fields: fields.filter((_, fieldIndex) => fieldIndex !== index) });
    };

    const resetToDefaultFields = () => {
        applyPatch({ fields: structuredClone(TZ_DEFAULT_FORM_FIELDS) });
    };

    return (
        <>
            <PropertySection title="Режим формы">
                <PropertySelect
                    value={(props.formMode as FormMode) || 'default'}
                    onChange={(event) => {
                        const mode = event.target.value as FormMode;
                        if (mode === 'search') {
                            const { width, height } = clampSearchFormDimensions(component.width);
                            const borderWidth =
                                typeof props.borderWidth === 'number' ? props.borderWidth : 0;
                            const savedBackground =
                                component.backgroundColor && component.backgroundColor !== 'transparent'
                                    ? component.backgroundColor
                                    : ((props.savedFormBackgroundColor as string | undefined) ?? '#ffffff');
                            applyPatch({
                                formMode: mode,
                                savedFormBackgroundColor: savedBackground,
                                ...(borderWidth <= 0 ? { borderWidth: 1 } : {}),
                            });
                            updateComponent(component.id, {
                                width,
                                height,
                                borderRadius: component.borderRadius ?? SEARCH_FORM_BORDER_RADIUS,
                            });
                            return;
                        }

                        const restoredBackground =
                            (props.savedFormBackgroundColor as string | undefined)
                            ?? (component.backgroundColor !== 'transparent'
                                ? component.backgroundColor
                                : '#ffffff');

                        applyPatch({ formMode: mode });
                        if (component.backgroundColor !== restoredBackground) {
                            updateComponent(component.id, { backgroundColor: restoredBackground });
                        }
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
                        <PropertyTextInput
                            value={String(fields[0]?.placeholder ?? 'Поиск...')}
                            placeholder="Подсказка в поле"
                            onChange={(event) => {
                                const next = fields.length > 0
                                    ? fields.map((field, index) =>
                                        index === 0
                                            ? { ...field, placeholder: event.target.value }
                                            : field
                                    )
                                    : [{
                                        name: 'search',
                                        label: 'Поиск',
                                        type: 'text' as const,
                                        placeholder: event.target.value,
                                    }];
                                applyPatch({ fields: next });
                            }}
                        />
                        <p className={styles.hintText}>
                            Поиск срабатывает при вводе: строка таблицы показывается, если хотя бы в одной
                            ячейке есть введённый текст. Очистите поле, чтобы сбросить фильтр.
                        </p>
                    </PropertySection>
                </>
            ) : (
                <>
                    <PropertySection title="Раскладка">
                        <PropertySelect
                            value={layout}
                            onChange={(event) => {
                                const nextLayout = normalizeFormLayout(event.target.value);
                                applyPatch({
                                    layout: nextLayout,
                                    submitLabel:
                                        nextLayout === 'row' ? 'Добавить строку' : 'Добавить колонку',
                                });
                            }}
                            options={[
                                { value: 'column', label: 'Столбец' },
                                { value: 'row', label: 'Строка' },
                            ]}
                        />
                        <p className={styles.hintText}>
                            {layout === 'column'
                                ? 'Отправка добавляет колонку после последней. Первое поле — заголовок (обязательное). Каждое следующее поле — значение только для соответствующей строки; без поля или без ввода ячейка остаётся пустой.'
                                : 'Отправка добавляет строку после последней. Первое поле — значение первой колонки, каждое следующее — для следующей колонки. Незаполненные ячейки остаются пустыми.'}
                        </p>
                    </PropertySection>
                    <PropertySection
                        title="Поля формы"
                        action={
                            <PropertyButton onClick={addValueField}>+ Поле</PropertyButton>
                        }
                    >
                        <PropertyButton variant="ghost" onClick={resetToDefaultFields}>
                            Стандартный набор
                        </PropertyButton>
                        {fields.map((field, index) => (
                            <div key={`${field.name}-${index}`} style={{ marginBottom: 12 }}>
                                <PropertyTextInput
                                    value={field.label}
                                    placeholder="Подпись"
                                    onChange={(event) => updateField(index, { label: event.target.value })}
                                />
                                {index === 0 ? (
                                    <p className={styles.hintText}>Обязательное поле заголовка</p>
                                ) : (
                                    <>
                                        <PropertyTextInput
                                            value={field.name}
                                            placeholder="Ключ поля"
                                            onChange={(event) => updateField(index, { name: event.target.value })}
                                        />
                                        <PropertySelect
                                            value={field.type === 'select' ? 'text' : field.type}
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
                                    </>
                                )}
                            </div>
                        ))}
                    </PropertySection>
                    <PropertySection title="Кнопка отправки">
                        <PropertyTextInput
                            value={String(
                                props.submitLabel ?? (layout === 'row' ? 'Добавить строку' : 'Добавить колонку')
                            )}
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
                    ? 'В «Привязка к данным» отметьте таблицу или график. Поиск фильтрует строки по всем колонкам.'
                    : 'В «Привязка к данным» отметьте таблицу. Кнопка отправки добавит столбец или строку.'}
            </p>

            <ComponentTargetsSection
                excludeComponentId={component.id}
                targetComponentIds={(props.targetComponentIds as string[]) ?? []}
                onChange={(ids) => applyPatch({ targetComponentIds: ids })}
            />
        </>
    );
};
