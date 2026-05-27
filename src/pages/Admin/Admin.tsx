import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useComponentStore, type ComponentDefinition } from '@/store/componentStore';
import { COMPONENT_CATEGORIES, getCategoryLabel } from '@/constants/componentCategories';
import { isMockEnabled } from '@/config/env';
import styles from './Admin.module.css';

type ComponentFormValues = {
    type: string;
    name: string;
    category: string;
    defaultWidth: number;
    defaultHeight: number;
};

const AdminPage = () => {
    const {
        getAllComponents,
        registerComponent,
        updateComponent,
        removeComponent,
        setComponentEnabled,
    } = useComponentStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<string | null>(null);
    const [form] = Form.useForm<ComponentFormValues>();

    const components = getAllComponents();

    useEffect(() => {
        if (!isModalOpen) {
            form.resetFields();
            setEditingType(null);
        }
    }, [form, isModalOpen]);

    const openCreateModal = () => {
        setEditingType(null);
        form.setFieldsValue({
            type: '',
            name: '',
            category: 'custom',
            defaultWidth: 200,
            defaultHeight: 120,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (component: ComponentDefinition) => {
        setEditingType(component.type);
        form.setFieldsValue({
            type: component.type,
            name: component.name,
            category: component.category,
            defaultWidth: component.defaultWidth,
            defaultHeight: component.defaultHeight,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const normalizedType = values.type.trim().toLowerCase();

        if (!normalizedType) {
            message.error('Укажите тип компонента');
            return;
        }

        const duplicate = components.find(
            (component) => component.type === normalizedType && component.type !== editingType
        );

        if (duplicate) {
            message.error('Компонент с таким типом уже существует');
            return;
        }

        if (editingType) {
            updateComponent(editingType, {
                name: values.name.trim(),
                category: values.category,
                defaultWidth: values.defaultWidth,
                defaultHeight: values.defaultHeight,
            });
            message.success('Компонент обновлён');
        } else {
            registerComponent({
                type: normalizedType,
                name: values.name.trim(),
                category: values.category,
                defaultWidth: values.defaultWidth,
                defaultHeight: values.defaultHeight,
                defaultProps: {
                    text: values.name.trim(),
                },
                editableFields: ['text', 'width', 'height', 'x', 'y', 'backgroundColor'],
                enabled: true,
            });
            message.success('Компонент добавлен');
        }

        setIsModalOpen(false);
    };

    const columns: ColumnsType<ComponentDefinition> = useMemo(() => [
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Категория',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => getCategoryLabel(category),
        },
        {
            title: 'Размер',
            key: 'size',
            render: (_, record) => `${record.defaultWidth} × ${record.defaultHeight}`,
        },
        {
            title: 'Источник',
            key: 'source',
            render: (_, record) => (
                <Tag color={record.isBuiltIn ? 'blue' : 'green'}>
                    {record.isBuiltIn ? 'Базовый' : 'Пользовательский'}
                </Tag>
            ),
        },
        {
            title: 'Статус',
            key: 'enabled',
            render: (_, record) => (
                <Switch
                    checked={record.enabled !== false}
                    onChange={(checked) => setComponentEnabled(record.type, checked)}
                />
            ),
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openEditModal(record)}>
                        Изменить
                    </Button>
                    {!record.isBuiltIn && (
                        <Button
                            size="small"
                            danger
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Удалить компонент?',
                                    content: `Компонент "${record.name}" будет удалён из библиотеки.`,
                                    okText: 'Удалить',
                                    cancelText: 'Отмена',
                                    onOk: () => {
                                        removeComponent(record.type);
                                        message.success('Компонент удалён');
                                    },
                                });
                            }}
                        >
                            Удалить
                        </Button>
                    )}
                </Space>
            ),
        },
    ], [removeComponent, setComponentEnabled]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Админ-панель</h1>
                    <p className={styles.subtitle}>Управление библиотекой компонентов конструктора</p>
                </div>
                <Button type="primary" onClick={openCreateModal}>
                    Добавить компонент
                </Button>
            </div>

            <Alert
                type="info"
                showIcon
                className={styles.alert}
                message={`Режим данных: ${isMockEnabled ? 'mock (localStorage)' : 'backend API'}`}
                description="Изменения библиотеки компонентов сохраняются локально и сразу доступны в редакторе."
            />

            <Table
                rowKey="type"
                columns={columns}
                dataSource={components}
                pagination={{ pageSize: 8 }}
            />

            <Modal
                title={editingType ? 'Редактировать компонент' : 'Добавить компонент'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingType ? 'Сохранить' : 'Добавить'}
                cancelText="Отмена"
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Тип (идентификатор)"
                        name="type"
                        rules={[{ required: true, message: 'Укажите тип компонента' }]}
                    >
                        <Input disabled={Boolean(editingType)} placeholder="badge, timeline, map..." />
                    </Form.Item>
                    <Form.Item
                        label="Название"
                        name="name"
                        rules={[{ required: true, message: 'Укажите название' }]}
                    >
                        <Input placeholder="Бейдж статуса" />
                    </Form.Item>
                    <Form.Item
                        label="Категория"
                        name="category"
                        rules={[{ required: true, message: 'Выберите категорию' }]}
                    >
                        <Select
                            options={COMPONENT_CATEGORIES
                                .filter((category) => category.id !== 'all')
                                .map((category) => ({
                                    value: category.id,
                                    label: category.label,
                                }))}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Ширина по умолчанию"
                        name="defaultWidth"
                        rules={[{ required: true, message: 'Укажите ширину' }]}
                    >
                        <InputNumber min={40} max={2000} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        label="Высота по умолчанию"
                        name="defaultHeight"
                        rules={[{ required: true, message: 'Укажите высоту' }]}
                    >
                        <InputNumber min={30} max={2000} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminPage;
