import {Button, Form, Input, Radio, message} from 'antd';
import {useNavigate} from 'react-router-dom';
import {useProjectStore} from '@/store/projectStore';
import styles from './CreateAppPopup.module.css';

interface CreateAppPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateAppPopup = ({isOpen, onClose, onSuccess}: CreateAppPopupProps) => {
    const navigate = useNavigate();
    const {createProject, loading} = useProjectStore();
    const [form] = Form.useForm();

    const handleFinish = async (values: { name: string; navigationType: 'sidebar' | 'topbar' }) => {
        try {
            const newProject = await createProject(values.name, values.navigationType);
            message.success('Проект создан успешно');
            if (newProject) {
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
                navigate(`/builder/${newProject.id}`);
            }
        } catch {
            message.error('Ошибка при создании проекта');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Создать приложение</h2>
                <p className={styles.description}>
                    Заполните форму для создания нового CRM-приложения
                </p>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{navigationType: 'sidebar'}}
                    className={styles.form}
                >
                    <Form.Item
                        label="Название проекта"
                        name="name"
                        rules={[{required: true, message: 'Введите название проекта'}]}
                    >
                        <Input
                            placeholder="Мой CRM проект"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Тип навигации"
                        name="navigationType"
                        rules={[{required: true, message: 'Выберите тип навигации'}]}
                    >
                        <Radio.Group buttonStyle="solid" size="large">
                            <Radio.Button value="sidebar">
                                Боковое меню
                            </Radio.Button>
                            <Radio.Button value="topbar">
                                Верхнее меню
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item>
                        <div className={styles.buttons}>
                            <Button
                                onClick={onClose}
                                size="large"
                            >
                                Отмена
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                size="large"
                            >
                                Создать проект
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default CreateAppPopup;