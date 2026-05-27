import { Form, Input, Modal, Select } from 'antd';
import { TEMPLATE_TYPES } from '@/constants/templateTypes';

export type SaveProjectTemplateFormValues = {
    name: string;
    type: string;
};

interface SaveProjectTemplateModalProps {
    open: boolean;
    defaultName: string;
    defaultType: string;
    onCancel: () => void;
    onSubmit: (values: SaveProjectTemplateFormValues) => void;
}

export const SaveProjectTemplateModal = ({
    open,
    defaultName,
    defaultType,
    onCancel,
    onSubmit,
}: SaveProjectTemplateModalProps) => {
    const [form] = Form.useForm<SaveProjectTemplateFormValues>();

    return (
        <Modal
            title="Сохранить проект как шаблон"
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
                        type: defaultType,
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
                    <Input placeholder="Например: CRM-дашборд" />
                </Form.Item>
                <Form.Item
                    label="Тип шаблона"
                    name="type"
                    rules={[{ required: true, message: 'Выберите тип' }]}
                >
                    <Select
                        options={TEMPLATE_TYPES
                            .filter((type) => type.id !== 'all')
                            .map((type) => ({
                                value: type.id,
                                label: type.label,
                            }))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
