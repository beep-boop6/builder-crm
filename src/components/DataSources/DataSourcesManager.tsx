import { useEffect, useState } from 'react';
import { Popconfirm, message } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDataStore } from '@/store/dataStore';
import { generateGuid } from '@/utils';
import type { DataSourceType } from '@/types/data';
import styles from './DataSourcesManager.module.css';

const SOURCE_TYPE_OPTIONS: Array<{ value: DataSourceType; label: string; hint: string }> = [
    {
        value: 'mock',
        label: 'Готовый пример',
        hint: 'Подойдёт, чтобы быстро попробовать таблицу или график',
    },
    {
        value: 'rest',
        label: 'Ссылка из интернета',
        hint: 'Адрес, по которому лежат ваши данные в виде таблицы',
    },
];

const MOCK_DATA_OPTIONS = [
    { value: 'users', label: 'Клиенты (пример)' },
    { value: 'sales', label: 'Продажи (пример)' },
];

const getTypeLabel = (type: DataSourceType) =>
    type === 'mock' ? 'Готовый пример' : 'Ссылка из интернета';

const getMockLabel = (endpoint: string) =>
    MOCK_DATA_OPTIONS.find((item) => item.value === endpoint)?.label ?? endpoint;

const getStatusText = (record: {
    isLoading?: boolean;
    error?: string | null;
    data?: Record<string, unknown>[] | null;
}) => {
    if (record.isLoading) {
        return { tone: 'loading' as const, text: 'Проверяем подключение…' };
    }
    if (record.error) {
        return { tone: 'error' as const, text: 'Не удалось получить данные' };
    }
    if (record.data) {
        const count = record.data.length;
        const word = count === 1 ? 'запись' : count < 5 ? 'записи' : 'записей';
        return { tone: 'success' as const, text: `Данные получены · ${count} ${word}` };
    }
    return { tone: 'idle' as const, text: 'Ещё не проверяли' };
};

export const DataSourcesManager = () => {
    const { sources, addSource, removeSource, loadData, loadAllSources } = useDataStore();

    const [name, setName] = useState('');
    const [type, setType] = useState<DataSourceType>('mock');
    const [endpoint, setEndpoint] = useState('users');

    useEffect(() => {
        loadAllSources();
    }, [loadAllSources]);

    const handleTypeChange = (nextType: DataSourceType) => {
        setType(nextType);
        setEndpoint(nextType === 'mock' ? 'users' : '');
    };

    const handleAddSource = () => {
        const trimmedName = name.trim();
        const trimmedEndpoint = endpoint.trim();

        if (!trimmedName) {
            message.warning('Введите название — так вы узнаете источник в редакторе');
            return;
        }

        if (!trimmedEndpoint) {
            message.warning(
                type === 'mock'
                    ? 'Выберите пример данных'
                    : 'Укажите ссылку, откуда загружать данные'
            );
            return;
        }

        if (type === 'rest' && !trimmedEndpoint.startsWith('http')) {
            message.warning('Ссылка должна начинаться с https://');
            return;
        }

        addSource({
            id: generateGuid(),
            name: trimmedName,
            type,
            endpoint: trimmedEndpoint,
        });

        message.success('Источник добавлен');
        setName('');
        setType('mock');
        setEndpoint('users');
    };

    return (
        <div className={styles.container}>
            <section className={styles.infoBox}>
                <h2 className={styles.infoTitle}>Что это за раздел?</h2>
                <p className={styles.infoText}>
                    Источник данных — это место, откуда таблица или график берут строки и
                    числа. Вы один раз настраиваете подключение здесь, а в редакторе просто
                    выбираете его в свойствах компонента.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Добавить источник</h2>

                <div className={styles.form}>
                    <label className={styles.field}>
                        <span className={styles.label}>Название</span>
                        <span className={styles.hint}>
                            Как вы будете узнавать этот источник в редакторе
                        </span>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Например: Список клиентов"
                        />
                    </label>

                    <fieldset className={styles.field}>
                        <legend className={styles.label}>Откуда брать данные</legend>
                        <div className={styles.typeOptions}>
                            {SOURCE_TYPE_OPTIONS.map((option) => (
                                <label key={option.value} className={styles.typeOption}>
                                    <input
                                        type="radio"
                                        name="sourceType"
                                        value={option.value}
                                        checked={type === option.value}
                                        onChange={() => handleTypeChange(option.value)}
                                    />
                                    <span className={styles.typeOptionContent}>
                                        <span className={styles.typeOptionTitle}>
                                            {option.label}
                                        </span>
                                        <span className={styles.typeOptionHint}>
                                            {option.hint}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className={styles.field}>
                        <span className={styles.label}>
                            {type === 'mock' ? 'Какой пример использовать' : 'Ссылка на данные'}
                        </span>
                        {type === 'mock' ? (
                            <select
                                className={styles.select}
                                value={endpoint}
                                onChange={(event) => setEndpoint(event.target.value)}
                            >
                                {MOCK_DATA_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <>
                                <input
                                    className={styles.input}
                                    value={endpoint}
                                    onChange={(event) => setEndpoint(event.target.value)}
                                    placeholder="https://example.com/data.json"
                                />
                                <span className={styles.hint}>
                                    Нужна публичная ссылка, которая открывается как список записей
                                </span>
                            </>
                        )}
                    </label>

                    <button type="button" className={styles.primaryButton} onClick={handleAddSource}>
                        Добавить источник
                    </button>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.listHeader}>
                    <h2 className={styles.sectionTitle}>Ваши источники</h2>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => loadAllSources()}
                    >
                        <ReloadOutlined />
                        Проверить все
                    </button>
                </div>

                {sources.length === 0 ? (
                    <div className={styles.emptyState}>
                        Пока нет подключённых источников. Добавьте первый — можно начать с
                        готового примера.
                    </div>
                ) : (
                    <ul className={styles.sourceList}>
                        {sources.map((source) => {
                            const status = getStatusText(source);
                            const endpointLabel =
                                source.type === 'mock'
                                    ? getMockLabel(source.endpoint)
                                    : source.endpoint;

                            return (
                                <li key={source.id} className={styles.sourceCard}>
                                    <div className={styles.sourceMain}>
                                        <div className={styles.sourceTop}>
                                            <span className={styles.sourceName}>{source.name}</span>
                                            <span className={styles.typeBadge}>
                                                {getTypeLabel(source.type)}
                                            </span>
                                        </div>
                                        <p className={styles.sourceEndpoint}>{endpointLabel}</p>
                                        {source.fields.length > 0 ? (
                                            <p className={styles.sourceFields}>
                                                Поля в данных: {source.fields.join(', ')}
                                            </p>
                                        ) : null}
                                        <span
                                            className={`${styles.statusBadge} ${styles[`status_${status.tone}`]}`}
                                        >
                                            {status.text}
                                        </span>
                                    </div>

                                    <div className={styles.sourceActions}>
                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            onClick={() => loadData(source.id)}
                                        >
                                            <ReloadOutlined />
                                            Проверить
                                        </button>
                                        <Popconfirm
                                            title="Удалить источник?"
                                            description={`«${source.name}» больше не будет доступен в редакторе.`}
                                            okText="Удалить"
                                            cancelText="Отмена"
                                            onConfirm={() => {
                                                removeSource(source.id);
                                                message.success('Источник удалён');
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className={styles.dangerButton}
                                                aria-label="Удалить"
                                            >
                                                <DeleteOutlined />
                                            </button>
                                        </Popconfirm>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};
