import { FormEvent, useEffect, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import styles from './CreateAppPopup.module.css';

interface CreateAppPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateAppPopup = ({ isOpen, onClose, onSuccess }: CreateAppPopupProps) => {
    const navigate = useNavigate();
    const { createProject, loading } = useProjectStore();
    const [name, setName] = useState('');
    const [navigationType, setNavigationType] = useState<'sidebar' | 'topbar'>('topbar');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setNavigationType('topbar');
            setNameError('');
        }
    }, [isOpen]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError('Введите название проекта');
            return;
        }

        setNameError('');

        try {
            const newProject = await createProject(trimmedName, navigationType);
            message.success('Проект создан успешно');
            if (newProject) {
                onSuccess?.();
                onClose();
                navigate(`/builder/${newProject.id}`);
            }
        } catch {
            message.error('Ошибка при создании проекта');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <h2 className={styles.title}>Создать приложение</h2>
                <p className={styles.description}>
                    Заполните форму для создания нового CRM-приложения
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="create-app-name">
                            Название проекта
                        </label>
                        <input
                            id="create-app-name"
                            className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                if (nameError) {
                                    setNameError('');
                                }
                            }}
                            autoFocus
                        />
                        {nameError ? <span className={styles.errorText}>{nameError}</span> : null}
                    </div>

                    <div className={styles.field}>
                        <span className={styles.fieldLabel}>Тип навигации:</span>
                        <div className={styles.navigationTabs} role="tablist" aria-label="Тип навигации">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={navigationType === 'sidebar'}
                                className={`${styles.navigationTab}${navigationType === 'sidebar' ? ` ${styles.navigationTabActive}` : ''}`}
                                onClick={() => setNavigationType('sidebar')}
                            >
                                Боковое
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={navigationType === 'topbar'}
                                className={`${styles.navigationTab}${navigationType === 'topbar' ? ` ${styles.navigationTabActive}` : ''}`}
                                onClick={() => setNavigationType('topbar')}
                            >
                                Верхнее
                            </button>
                        </div>
                    </div>

                    <div className={styles.buttons}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Создание…' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAppPopup;
