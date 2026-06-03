import { useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { PropertySection } from './PropertyFields';
import styles from './PropertiesPanel.module.css';

const TYPE_LABELS: Record<string, string> = {
    table: 'Таблица',
    chart: 'График',
};

const DEFAULT_LINKABLE_TYPES = ['table', 'chart'];

interface Props {
    targetComponentIds: string[];
    onChange: (ids: string[]) => void;
    excludeComponentId?: string;
    /** Какие типы можно привязать (по умолчанию только таблица и график). */
    linkableTypes?: string[];
    hint?: string;
}

export const ComponentTargetsSection = ({
    targetComponentIds,
    onChange,
    excludeComponentId,
    linkableTypes = DEFAULT_LINKABLE_TYPES,
    hint,
}: Props) => {
    const components = useEditorStore((state) => state.components);

    const candidates = useMemo(
        () =>
            components.filter((component) => {
                if (component.id === excludeComponentId) {
                    return false;
                }
                return linkableTypes.includes(component.type);
            }),
        [components, excludeComponentId, linkableTypes]
    );

    const toggleTarget = (id: string) => {
        if (targetComponentIds.includes(id)) {
            onChange(targetComponentIds.filter((item) => item !== id));
            return;
        }
        onChange([...targetComponentIds, id]);
    };

    const defaultHint =
        'Только для фильтра и формы: отметьте таблицу или график, чьи данные нужно сужать на холсте (без отправки на сервер).';

    return (
        <PropertySection title="Привязка к данным">
            <p className={styles.hintText}>{hint ?? defaultHint}</p>
            {targetComponentIds.length > 0 ? (
                <p className={styles.hintText}>
                    Привязано: {targetComponentIds.length}
                </p>
            ) : (
                <p className={styles.hintTextWarning}>Ни один компонент не привязан — фильтр не влияет на данные</p>
            )}
            {candidates.length === 0 ? (
                <p className={styles.hintText}>Добавьте на страницу таблицу или график</p>
            ) : (
                <div className={styles.targetList}>
                    {candidates.map((component) => {
                        const checked = targetComponentIds.includes(component.id);
                        const typeLabel = TYPE_LABELS[component.type] ?? component.type;
                        const name = component.text?.trim() || typeLabel;
                        return (
                            <label key={component.id} className={styles.targetItem}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleTarget(component.id)}
                                />
                                <span>
                                    {typeLabel}: {name}
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}
        </PropertySection>
    );
};
