import type { TableColumnMapping } from '@/types/data';
import type { DataSource } from '@/store/dataStore';
import { buildDefaultTableMappings } from '@/utils/dataMapping';
import { validateChartMapping, validateTableMapping } from '@/utils/dataValidation';
import type { DataRow } from '@/utils/dataValidation';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    PropertyAlert,
    PropertyButton,
    PropertySection,
    PropertySelect,
    PropertyTextInput,
} from './PropertyFields';
import styles from './PropertiesPanel.module.css';

interface TableMappingSectionProps {
    source: DataSource | undefined;
    mappings: TableColumnMapping[];
    onChange: (mappings: TableColumnMapping[]) => void;
    onReload: () => void;
}

export const TableMappingSection = ({
    source,
    mappings,
    onChange,
    onReload,
}: TableMappingSectionProps) => {
    const fields = source?.fields ?? [];
    const rows = source?.data ?? [];

    const validation = rows.length > 0
        ? validateTableMapping(rows, mappings)
        : { valid: true as const };

    const updateMapping = (index: number, patch: Partial<TableColumnMapping>) => {
        const next = mappings.map((item, itemIndex) =>
            itemIndex === index ? { ...item, ...patch } : item
        );
        onChange(next);
    };

    return (
        <PropertySection
            title="Данные таблицы"
            action={(
                <PropertyButton variant="ghost" onClick={onReload} disabled={!source} icon={<ReloadOutlined />}>
                    Обновить
                </PropertyButton>
            )}
        >
            {source?.isLoading && <PropertyAlert type="info" message="Загрузка данных..." />}
            {source?.error && <PropertyAlert type="error" message={source.error} />}
            {!validation.valid && validation.error && (
                <PropertyAlert type="warning" message={validation.error} />
            )}

            {mappings.length === 0 && (
                <PropertyAlert type="info" message="Колонки не заданы — показываются все поля источника" />
            )}

            {mappings.map((mapping, index) => (
                <div key={`${mapping.sourceField}-${index}`} className={styles.mappingRow}>
                    <PropertySelect
                        value={mapping.sourceField || ''}
                        onChange={(event) => updateMapping(index, { sourceField: event.target.value })}
                        options={[
                            { value: '', label: 'Колонка источника' },
                            ...fields.map((field) => ({ value: field, label: field })),
                        ]}
                    />
                    <PropertyTextInput
                        value={mapping.title}
                        placeholder="Заголовок"
                        onChange={(event) => updateMapping(index, { title: event.target.value })}
                    />
                    <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        onClick={() => onChange(mappings.filter((_, itemIndex) => itemIndex !== index))}
                        title="Удалить колонку"
                    >
                        ×
                    </button>
                </div>
            ))}

            <div className={styles.mappingActions}>
                <PropertyButton
                    block
                    variant="outline"
                    icon={<PlusOutlined />}
                    disabled={fields.length === 0}
                    onClick={() => {
                        const nextField = fields.find((field) => !mappings.some((mapping) => mapping.sourceField === field));
                        if (!nextField) {
                            return;
                        }
                        onChange([...mappings, { sourceField: nextField, title: nextField }]);
                    }}
                >
                    Добавить колонку
                </PropertyButton>

                <PropertyButton
                    block
                    variant="ghost"
                    disabled={rows.length === 0}
                    onClick={() => onChange(buildDefaultTableMappings(rows))}
                >
                    Подставить все поля источника
                </PropertyButton>
            </div>
        </PropertySection>
    );
};

interface ChartTableMappingSectionProps {
    columns: Array<{ id: string; title: string }>;
    rows: DataRow[];
    xField: string;
    yField: string;
    onChange: (mapping: { xField: string; yField: string }) => void;
}

export const ChartTableMappingSection = ({
    columns,
    rows,
    xField,
    yField,
    onChange,
}: ChartTableMappingSectionProps) => {
    const validation = rows.length > 0
        ? validateChartMapping(rows, { xField, yField })
        : { valid: true as const };

    const columnOptions = [
        { value: '', label: '— выберите колонку —' },
        ...columns.map((column) => ({ value: column.id, label: column.title })),
    ];

    return (
        <PropertySection title="Данные графика">
            {columns.length === 0 && (
                <PropertyAlert type="info" message="У таблицы пока нет колонок" />
            )}
            {!validation.valid && validation.error && (
                <PropertyAlert type="warning" message={validation.error} />
            )}

            <span className={styles.subsectionTitle}>Ось X</span>
            <PropertySelect
                value={xField}
                onChange={(event) => onChange({ xField: event.target.value, yField })}
                options={columnOptions}
            />

            <span className={styles.subsectionTitle}>Ось Y</span>
            <PropertySelect
                value={yField}
                onChange={(event) => onChange({ xField, yField: event.target.value })}
                options={columnOptions}
            />

            <p className={styles.hintText}>
                График строится по строкам привязанной таблицы с учётом активных фильтров на холсте.
            </p>
        </PropertySection>
    );
};

interface ChartMappingSectionProps {
    source: DataSource | undefined;
    xField: string;
    yField: string;
    onChange: (mapping: { xField: string; yField: string }) => void;
    onReload: () => void;
}

export const ChartMappingSection = ({
    source,
    xField,
    yField,
    onChange,
    onReload,
}: ChartMappingSectionProps) => {
    const fields = source?.fields ?? [];
    const rows = source?.data ?? [];
    const validation = rows.length > 0
        ? validateChartMapping(rows, { xField, yField })
        : { valid: true as const };

    const fieldOptions = [
        { value: '', label: 'Выберите поле' },
        ...fields.map((field) => ({ value: field, label: field })),
    ];

    return (
        <PropertySection
            title="Данные графика"
            action={(
                <PropertyButton variant="ghost" onClick={onReload} disabled={!source} icon={<ReloadOutlined />}>
                    Обновить
                </PropertyButton>
            )}
        >
            {source?.isLoading && <PropertyAlert type="info" message="Загрузка данных..." />}
            {source?.error && <PropertyAlert type="error" message={source.error} />}
            {!validation.valid && validation.error && (
                <PropertyAlert type="warning" message={validation.error} />
            )}

            <span className={styles.subsectionTitle}>Ось X</span>
            <PropertySelect
                value={xField}
                onChange={(event) => onChange({ xField: event.target.value, yField })}
                options={fieldOptions}
            />

            <span className={styles.subsectionTitle}>Ось Y</span>
            <PropertySelect
                value={yField}
                onChange={(event) => onChange({ xField, yField: event.target.value })}
                options={fieldOptions}
            />
        </PropertySection>
    );
};
