import { useEffect, useState } from 'react';
import { Popconfirm, message } from 'antd';
import { useDataStore } from '@/store/dataStore';
import { generateGuid } from '@/utils';
import type { DataSourceType } from '@/types/data';
import styles from './DataSourcesManager.module.css';

const MOCK_DATA_OPTIONS = [
    { value: 'users', label: 'Клиенты (пример)' },
    { value: 'sales', label: 'Продажи (пример)' },
];

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
        return { tone: 'success' as const, text: `Данные получены - ${count} ${word}` };
    }
    return { tone: 'idle' as const, text: 'Ещё не проверяли' };
};

const resolveSourceType = (endpoint: string): DataSourceType =>
    endpoint.startsWith('http') ? 'rest' : 'mock';

interface DataSourcesManagerProps {
    variant?: 'default' | 'editor';
}

export const DataSourcesManager = ({ variant = 'default' }: DataSourcesManagerProps) => {
    const { sources, addSource, removeSource, loadData, loadAllSources } = useDataStore();
    const isEditor = variant === 'editor';

    const [name, setName] = useState('');
    const [endpoint, setEndpoint] = useState('users');

    useEffect(() => {
        loadAllSources();
    }, [loadAllSources]);

    const handleAddSource = () => {
        const trimmedName = name.trim();
        const trimmedEndpoint = endpoint.trim();

        if (!trimmedName) {
            message.warning('Введите название — так вы узнаете источник в редакторе');
            return;
        }

        if (!trimmedEndpoint) {
            message.warning('Укажите ссылку на источник данных');
            return;
        }

        const type = resolveSourceType(trimmedEndpoint);

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
        setEndpoint('users');
    };

    if (isEditor) {
        return (
            <div className={`${styles.container} ${styles.containerEditor}`}>
                <div className={styles.addCard}>
                    <h3 className={styles.addCardTitle}>Добавление источника</h3>
                    <div className={styles.addForm}>
                        <label className={styles.addField}>
                            <span className={styles.addFieldLabel}>Название</span>
                            <input
                                className={`${styles.addInput} ${styles.addInputName}`}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </label>
                        <label className={styles.addField}>
                            <span className={styles.addFieldLabel}>Ссылка на источник данных</span>
                            <div className={styles.addInputShell}>
                                <input
                                    className={`${styles.addInput} ${styles.addInputLink}`}
                                    list="data-source-endpoints"
                                    value={endpoint}
                                    onChange={(event) => setEndpoint(event.target.value)}
                                />
                                <span className={styles.addInputArrow} aria-hidden="true" />
                                <datalist id="data-source-endpoints">
                                    {MOCK_DATA_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                        </label>
                        <button type="button" className={styles.addButton} onClick={handleAddSource}>
                            Добавить
                        </button>
                    </div>
                </div>

                <div className={styles.listSection}>
                    <h3 className={styles.listTitle}>Ваши источники</h3>

                    {sources.length === 0 ? (
                        <div className={styles.emptyStateEditor}>
                            Пока нет подключённых источников. Добавьте первый — можно начать с готового примера.
                        </div>
                    ) : (
                        <ul className={styles.sourceListEditor}>
                            {sources.map((source) => {
                                const status = getStatusText(source);
                                const endpointLabel =
                                    source.type === 'mock'
                                        ? getMockLabel(source.endpoint)
                                        : source.endpoint;

                                return (
                                    <li key={source.id} className={styles.sourceCardEditor}>
                                        <div className={styles.sourceCardMain}>
                                            <div className={styles.sourceCardHeader}>
                                                <span className={styles.sourceName}>{source.name}</span>
                                                {source.type === 'mock' ? (
                                                    <span className={styles.exampleBadge}>Пример</span>
                                                ) : null}
                                            </div>
                                            {source.fields.length > 0 ? (
                                                <p className={styles.sourceFields}>
                                                    Поля в данных: {source.fields.join(', ')}
                                                </p>
                                            ) : (
                                                <p className={styles.sourceFields}>{endpointLabel}</p>
                                            )}
                                        </div>

                                        <div className={styles.sourceCardAside}>
                                            <span
                                                className={`${styles.statusBadge} ${styles[`status_${status.tone}`]}`}
                                            >
                                                {status.text}
                                            </span>
                                            <div className={styles.sourceCardActions}>
                                                <button
                                                    type="button"
                                                    className={styles.checkButton}
                                                    onClick={() => loadData(source.id)}
                                                >
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
                                                        className={styles.deleteButton}
                                                        aria-label="Удалить источник"
                                                    >
                                                        ×
                                                    </button>
                                                </Popconfirm>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

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

                    <label className={styles.field}>
                        <span className={styles.label}>Ссылка на источник данных</span>
                        <input
                            className={styles.input}
                            list="data-source-endpoints-default"
                            value={endpoint}
                            onChange={(event) => setEndpoint(event.target.value)}
                            placeholder="https://example.com/data.json"
                        />
                        <datalist id="data-source-endpoints-default">
                            {MOCK_DATA_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </datalist>
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
                                            {source.type === 'mock' ? (
                                                <span className={styles.typeBadge}>Пример</span>
                                            ) : null}
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
                                                ×
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
