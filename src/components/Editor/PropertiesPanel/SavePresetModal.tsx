import { Form, Input, Modal, Select } from 'antd';
import { COMPONENT_CATEGORIES } from '@/constants/componentCategories';

export type SavePresetFormValues = {
    name: string;
    category: string;
};

interface SavePresetModalProps {
    open: boolean;
    defaultName: string;
    defaultCategory: string;
    onCancel: () => void;
    onSubmit: (values: SavePresetFormValues) => void;
}

export const SavePresetModal = ({
    open,
    defaultName,
    defaultCategory,
    onCancel,
    onSubmit,
}: SavePresetModalProps) => {
    const [form] = Form.useForm<SavePresetFormValues>();

    return (
        <Modal
            title="Сохранить как шаблон"
            open={open}
            onCancel={onCancel}
            onOk={async () => {
                const values = await form.validateFields();
                onSubmit(values);
            }}
            okText="Сохранить"
            cancelText="Отмена"
            destroyOnHidden
            afterOpenChange={(visible) => {
                if (visible) {
                    form.setFieldsValue({
                        name: defaultName,
                        category: defaultCategory,
                    });
                }
            }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Название шаблона"
                    name="name"
                    rules={[{ required: true, message: 'Введите название' }]}
                >
                    <Input placeholder="Например: KPI-карточка" />
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
            </Form>
        </Modal>
    );
};
