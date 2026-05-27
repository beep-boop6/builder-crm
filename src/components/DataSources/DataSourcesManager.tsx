import { useEffect } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDataStore } from '@/store/dataStore';
import { generateGuid } from '@/utils';
import type { DataSourceType } from '@/types/data';
import styles from './DataSourcesManager.module.css';

type SourceFormValues = {
    name: string;
    type: DataSourceType;
    endpoint: string;
};

export const DataSourcesManager = () => {
    const {
        sources,
        addSource,
        removeSource,
        loadData,
        loadAllSources,
    } = useDataStore();

    const [form] = Form.useForm<SourceFormValues>();

    useEffect(() => {
        loadAllSources();
    }, [loadAllSources]);

    const handleAddSource = async () => {
        const values = await form.validateFields();
        addSource({
            id: generateGuid(),
            name: values.name.trim(),
            type: values.type,
            endpoint: values.endpoint.trim(),
        });
        message.success('Источник добавлен');
        form.resetFields();
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (type: DataSourceType) => (
                <Tag color={type === 'mock' ? 'blue' : 'green'}>
                    {type === 'mock' ? 'Mock' : 'REST'}
                </Tag>
            ),
        },
        {
            title: 'Endpoint / ключ',
            dataIndex: 'endpoint',
            key: 'endpoint',
        },
        {
            title: 'Поля',
            key: 'fields',
            render: (_: unknown, record: typeof sources[number]) =>
                record.fields.length > 0 ? record.fields.join(', ') : '—',
        },
        {
            title: 'Статус',
            key: 'status',
            render: (_: unknown, record: typeof sources[number]) => {
                if (record.isLoading) {
                    return <Tag>Загрузка</Tag>;
                }
                if (record.error) {
                    return <Tag color="error">Ошибка</Tag>;
                }
                if (record.data) {
                    return <Tag color="success">OK ({record.data.length})</Tag>;
                }
                return <Tag>Не загружен</Tag>;
            },
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: typeof sources[number]) => (
                <Space>
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => loadData(record.id)}>
                        Загрузить
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Удалить источник?',
                                content: `Источник «${record.name}» будет удалён.`,
                                okText: 'Удалить',
                                cancelText: 'Отмена',
                                onOk: () => {
                                    removeSource(record.id);
                                    message.success('Источник удалён');
                                },
                            });
                        }}
                    >
                        Удалить
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Alert
                type="info"
                showIcon
                className={styles.alert}
                message="Несколько источников данных"
                description="Mock: users, sales. REST: укажите публичный URL, возвращающий JSON-массив объектов."
            />

            <Form
                form={form}
                layout="vertical"
                className={styles.form}
                initialValues={{ type: 'mock', endpoint: 'users' }}
            >
                <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
                    <Input placeholder="Заказы CRM" />
                </Form.Item>
                <Form.Item label="Тип" name="type" rules={[{ required: true }]}>
                    <Select
                        options={[
                            { value: 'mock', label: 'Mock (users / sales)' },
                            { value: 'rest', label: 'REST API' },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    label="Endpoint"
                    name="endpoint"
                    rules={[{ required: true, message: 'Укажите endpoint или URL' }]}
                >
                    <Input placeholder="users или https://api.example.com/data" />
                </Form.Item>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSource}>
                    Добавить источник
                </Button>
            </Form>

            <div className={styles.tableHeader}>
                <h3>Подключённые источники</h3>
                <Button icon={<ReloadOutlined />} onClick={() => loadAllSources()}>
                    Обновить все
                </Button>
            </div>

            <Table rowKey="id" columns={columns} dataSource={sources} pagination={false} />
        </div>
    );
};
