import addIcon from '@/assets/icons/add.svg';
import themeIcon from '@/assets/icons/theme-light.svg';
import settingsIcon from '@/assets/icons/settings.svg';
import logoIcon from '@/assets/icons/logo.svg';
import { useNavigate } from 'react-router-dom';
import styles from './EditorSidebar.module.css';

interface EditorSidebarProps {
    onToggleLibrary: () => void;
    onTogglePages: () => void;
}

export const EditorSidebar = ({ onToggleLibrary, onTogglePages }: EditorSidebarProps) => {
    const navigate = useNavigate();

    return (
        <div className={styles.editorSidebar}>
            <div className={styles.logoSection} onClick={() => navigate('/')}>
                <img src={logoIcon} alt="Logo" className={styles.logoImage}/>
            </div>

            <div className={styles.upperPanel}>
                <button
                    className={styles.menuButton}
                    onClick={onToggleLibrary}
                    title="Библиотека компонентов"
                >
                    <img src={addIcon} alt="Add" className={styles.iconImage}/>
                </button>
                <button
                    className={styles.menuButton}
                    onClick={onTogglePages}
                    title="Страницы"
                    style={{marginTop: '15px'}}
                >
                    <span style={{ fontSize: '20px' }}>📄</span>
                </button>
            </div>

            <div className={styles.bottomPanel}>
                <button className={styles.menuButton} title="Смена темы">
                    <img src={themeIcon} alt="Theme" className={styles.iconImage}/>
                </button>
                <button 
                    className={styles.menuButton} 
                    onClick={() => navigate('/settings')} 
                    title="Настройки" 
                    style={{marginTop: '15px'}}
                >
                    <img src={settingsIcon} alt="Settings" className={styles.iconImage}/>
                </button>
            </div>
        </div>
    );
};