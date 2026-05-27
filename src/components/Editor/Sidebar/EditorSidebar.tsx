import addIcon from '@/assets/icons/add.svg';
import pagesIcon from '@/assets/icons/pages.svg';
import previewIcon from '@/assets/icons/preview.svg';
import saveIcon from '@/assets/icons/save.svg';
import settingsIcon from '@/assets/icons/settings.svg';
import logoIcon from '@/assets/icons/logo.svg';
import { useNavigate } from 'react-router-dom';
import styles from './EditorSidebar.module.css';

interface EditorSidebarProps {
    onToggleLibrary: () => void;
    onTogglePages: () => void;
    onSave: () => void;
    onPreview: () => void;
    isLibraryOpen?: boolean;
    isPagesOpen?: boolean;
    saving?: boolean;
}

export const EditorSidebar = ({
    onToggleLibrary,
    onTogglePages,
    onSave,
    onPreview,
    isLibraryOpen = false,
    isPagesOpen = false,
    saving = false,
}: EditorSidebarProps) => {
    const navigate = useNavigate();

    return (
        <div className={styles.editorSidebar}>
            <div className={styles.logoSection} onClick={() => navigate('/create-app')}>
                <img src={logoIcon} alt="Logo" className={styles.logoImage} />
            </div>

            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={`${styles.menuButton} ${isLibraryOpen ? styles.menuButtonActive : ''}`}
                    onClick={onToggleLibrary}
                    title="Библиотека компонентов"
                >
                    <img src={addIcon} alt="" className={styles.iconImage} />
                </button>

                <button
                    type="button"
                    className={`${styles.menuButton} ${isPagesOpen ? styles.menuButtonActive : ''}`}
                    onClick={onTogglePages}
                    title="Страницы"
                >
                    <img src={pagesIcon} alt="" className={styles.iconImageSmall} />
                </button>

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={onPreview}
                    title="Предпросмотр"
                >
                    <img src={previewIcon} alt="" className={styles.iconImageSmall} />
                </button>

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={onSave}
                    disabled={saving}
                    title={saving ? 'Сохранение...' : 'Сохранить'}
                >
                    <img src={saveIcon} alt="" className={styles.iconImageSmall} />
                </button>

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() => navigate('/settings')}
                    title="Настройки"
                >
                    <img src={settingsIcon} alt="" className={styles.iconImage} />
                </button>
            </div>
        </div>
    );
};
