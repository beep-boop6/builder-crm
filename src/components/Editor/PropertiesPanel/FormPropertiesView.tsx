import type { EditorComponent } from '@/store/editorStore';
import { useEditorStore } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { useDataStore } from '@/store/dataStore';
import type { FormFieldDefinition, FormMode, SearchBackgroundMode } from '@/types/form';
import {
    clampSearchFormDimensions,
    getFormFieldsFromProps,
    syncFormComponentHeight,
    TZ_DEFAULT_FORM_FIELDS,
} from '@/utils/formLayout';
import { ComponentTargetsSection } from './ComponentTargetsSection';
import { DataMappingSection } from './DataMappingSection';
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
    const sources = useDataStore((state) => state.sources);

    const props = component.props ?? {};
    const fields = getFormFieldsFromProps(props);

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
                            const { width, height } = clampSearchFormDimensions(component.width, props);
                            applyPatch({ formMode: mode });
                            updateComponent(component.id, { width, height });
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
                    </PropertySection>
                    <PropertySection title="Оформление поиска">
                        <PropertySelect
                            value={(props.searchBackground as SearchBackgroundMode) || 'fill'}
                            onChange={(event) =>
                                applyPatch({ searchBackground: event.target.value as SearchBackgroundMode })
                            }
                            options={[
                                { value: 'fill', label: 'Фон на всю область' },
                                { value: 'transparent', label: 'Без фона (только поле)' },
                            ]}
                        />
                        <p className={styles.hintText}>
                            Цвет фона — в «Внешний вид». Ширина блока: 280–720 px (только по горизонтали).
                            Строка поиска растёт до 560 px, дальше остаётся по центру.
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
                </>
            )}

            <DataMappingSection
                dataSourceId={(props.dataSourceId as string) || 'none'}
                sources={sources}
                onDataSourceChange={(id) => applyPatch({ dataSourceId: id, formValues: {} })}
            />

            <p className={styles.hintText}>
                Источник данных подставляет значения в поля (первая строка). Поиск и кнопка «Отправить»
                передают условия в привязанные таблицу и график на холсте.
            </p>

            <ComponentTargetsSection
                excludeComponentId={component.id}
                targetComponentIds={(props.targetComponentIds as string[]) ?? []}
                onChange={(ids) => applyPatch({ targetComponentIds: ids })}
            />
        </>
    );
};
