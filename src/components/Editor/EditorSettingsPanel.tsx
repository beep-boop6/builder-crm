import { useEffect, useState } from 'react';
import { DataSourcesManager } from '@/components/DataSources/DataSourcesManager';
import styles from './EditorSettingsPanel.module.css';

interface EditorSettingsPanelProps {
    open: boolean;
    onClose: () => void;
    projectName: string;
    navigationType: 'sidebar' | 'topbar';
    saving?: boolean;
    onProjectNameChange: (name: string) => void;
    onNavigationTypeChange: (type: 'sidebar' | 'topbar') => void;
}

export const EditorSettingsPanel = ({
    open,
    onClose,
    projectName,
    navigationType,
    saving = false,
    onProjectNameChange,
    onNavigationTypeChange,
}: EditorSettingsPanelProps) => {
    const [nameDraft, setNameDraft] = useState(projectName);

    useEffect(() => {
        if (open) {
            setNameDraft(projectName);
        }
    }, [open, projectName]);

    if (!open) {
        return null;
    }

    const commitName = () => {
        const trimmed = nameDraft.trim();
        if (!trimmed || trimmed === projectName) {
            setNameDraft(projectName);
            return;
        }
        onProjectNameChange(trimmed);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.panel}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="editor-settings-title"
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Закрыть настройки"
                >
                    ×
                </button>

                <section className={styles.section}>
                    <h2 id="editor-settings-title" className={styles.sectionTitle}>
                        Общие настройки
                    </h2>

                    <div className={styles.generalForm}>
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Название проекта</span>
                            <input
                                className={styles.input}
                                value={nameDraft}
                                onChange={(event) => setNameDraft(event.target.value)}
                                onBlur={commitName}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.currentTarget.blur();
                                    }
                                }}
                                disabled={saving}
                            />
                        </label>

                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Расположение меню:</span>
                            <div className={styles.navigationTabs} role="tablist" aria-label="Расположение меню">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={navigationType === 'sidebar'}
                                    className={`${styles.navigationTab}${navigationType === 'sidebar' ? ` ${styles.navigationTabActive}` : ''}`}
                                    onClick={() => onNavigationTypeChange('sidebar')}
                                    disabled={saving}
                                >
                                    Боковое
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={navigationType === 'topbar'}
                                    className={`${styles.navigationTab}${navigationType === 'topbar' ? ` ${styles.navigationTabActive}` : ''}`}
                                    onClick={() => onNavigationTypeChange('topbar')}
                                    disabled={saving}
                                >
                                    Верхнее
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Источники данных</h2>
                    <p className={styles.sectionDescription}>
                        Здесь вы подключаете данные для таблиц и графиков в ваших приложениях.
                        Ничего сложного — укажите название и откуда брать информацию.
                    </p>
                    <DataSourcesManager variant="editor" />
                </section>
            </div>
        </div>
    );
};
