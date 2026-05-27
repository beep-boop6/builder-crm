import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import undoArrowIcon from '@/assets/icons/undo_arrow.svg';
import { BreadcrumbSeparator } from '@/components/Common/BreadcrumbSeparator';
import themeIcon from '@/assets/icons/theme-light.svg';
import { useUIStore } from '@/store/uiStore';
import styles from './EditorHeader.module.css';

interface EditorHeaderProps {
    projectName: string;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isPreview?: boolean;
    onExitPreview?: () => void;
}

export const EditorHeader = ({
    projectName,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isPreview = false,
    onExitPreview,
}: EditorHeaderProps) => {
    const navigate = useNavigate();
    const toggleTheme = useUIStore((state) => state.toggleTheme);

    const breadcrumbs: Array<{ label: string; path?: string }> = [
        { label: 'Приложения', path: '/create-app' },
        { label: projectName || 'Панель' },
    ];

    return (
        <header className={styles.header}>
            <nav className={styles.breadcrumbs} aria-label="Навигация">
                {breadcrumbs.map((item, index) => (
                    <Fragment key={`${item.label}-${index}`}>
                        {index > 0 && <BreadcrumbSeparator />}
                        {item.path ? (
                            <button
                                type="button"
                                className={styles.crumbLink}
                                onClick={() => navigate(item.path!)}
                            >
                                {item.label}
                            </button>
                        ) : (
                            <span className={styles.crumbCurrent}>{item.label}</span>
                        )}
                    </Fragment>
                ))}
            </nav>

            <div className={styles.center}>
                {!isPreview && (
                    <>
                        <button
                            type="button"
                            className={styles.historyButton}
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Отменить"
                        >
                            <img src={undoArrowIcon} alt="" className={styles.historyIcon} />
                        </button>
                        <h1 className={styles.projectTitle}>{projectName || 'Без названия'}</h1>
                        <button
                            type="button"
                            className={styles.historyButton}
                            onClick={onRedo}
                            disabled={!canRedo}
                            title="Повторить"
                        >
                            <img
                                src={undoArrowIcon}
                                alt=""
                                className={`${styles.historyIcon} ${styles.historyIconRedo}`}
                            />
                        </button>
                    </>
                )}
                {isPreview && (
                    <h1 className={styles.projectTitle}>{projectName || 'Без названия'}</h1>
                )}
            </div>

            <div className={styles.rightSection}>
                {isPreview && onExitPreview && (
                    <button type="button" className={styles.previewBackButton} onClick={onExitPreview}>
                        Вернуться в редактор
                    </button>
                )}
                <button
                    type="button"
                    className={styles.themeButton}
                    onClick={toggleTheme}
                    title="Смена темы"
                >
                    <img src={themeIcon} alt="" className={styles.themeIcon} />
                </button>
            </div>
        </header>
    );
};
