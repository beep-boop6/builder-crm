import type { EditorComponent } from '@/store/editorStore';
import { ComponentTargetsSection } from './ComponentTargetsSection';
import { PropertySection, PropertySelect, PropertyTextInput } from './PropertyFields';
import styles from './PropertiesPanel.module.css';

interface Props {
    component: EditorComponent;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

export const FilterPropertiesView = ({
    component,
    onUpdateProps,
}: Props) => {
    const props = component.props ?? {};

    const patch = (patchProps: Record<string, unknown>) => {
        onUpdateProps({ ...props, ...patchProps });
    };

    const filterType = (props.filterType as string) || 'status';

    return (
        <>
            <PropertySection title="Тип фильтра">
                <PropertySelect
                    value={filterType}
                    onChange={(event) => patch({ filterType: event.target.value })}
                    options={[
                        { value: 'status', label: 'По статусу' },
                        { value: 'date', label: 'По дате' },
                        { value: 'field', label: 'По значению поля' },
                    ]}
                />
            </PropertySection>

            <PropertySection title="Настройки">
                <PropertyTextInput
                    value={String(props.label ?? 'Фильтр')}
                    placeholder="Заголовок"
                    onChange={(event) => patch({ label: event.target.value })}
                />
                {filterType !== 'status' ? (
                    <PropertyTextInput
                        value={String(props.fieldKey ?? '')}
                        placeholder="Ключ поля в данных"
                        onChange={(event) => patch({ fieldKey: event.target.value })}
                    />
                ) : (
                    <PropertyTextInput
                        value={String(props.fieldKey ?? 'status')}
                        placeholder="Ключ поля"
                        onChange={(event) => patch({ fieldKey: event.target.value })}
                    />
                )}
            </PropertySection>

            <p className={styles.hintText}>
                Для демо без источника данных: привяжите фильтр к таблице и выберите статус — строки
                с колонкой «status» отфильтруются. С источником «Сделки (CRM)» ключ поля: status.
            </p>

            <ComponentTargetsSection
                excludeComponentId={component.id}
                targetComponentIds={(props.targetComponentIds as string[]) ?? []}
                onChange={(ids) => patch({ targetComponentIds: ids })}
            />
        </>
    );
};
