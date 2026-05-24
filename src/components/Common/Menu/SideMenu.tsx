import {useNavigate} from 'react-router-dom';
import homeIcon from '@/assets/icons/home_no_active-light.svg';
import createAppIcon from '@/assets/icons/edit_no_active-light.svg';
import themeIcon from '@/assets/icons/theme-light.svg';
import settingsIcon from '@/assets/icons/settings.svg';
import logoIcon from '@/assets/icons/logo.svg';
import styles from './SideMenu.module.css';

export const SideMenu = () => {
    const navigate = useNavigate();

    const handleHomeClick = () => {
        navigate('/');
    };

    const handleCreateAppClick = () => {
        navigate('/create-app');
    };

    const handleSettingsClick = () => {
        navigate('/settings');
    };

    const handleThemeToggle = () => {
        console.log('Theme toggle clicked');
    };

    return (
        <div className={styles.sideMenu}>
            {/* 1. Логотип - отступ от верхнего края 15px */}
            <div className={styles.logoSection} onClick={handleHomeClick}>
                <img src={logoIcon} alt="Logo" className={styles.logoImage}/>
            </div>

            <div className={styles.upperPanel}>
                <button
                    className={styles.menuButton}
                    onClick={handleHomeClick}
                    title="Главная"

                >
                    <img src={homeIcon} alt="Home" className={styles.iconImage}/>
                </button>

                {/* 3. Кнопка создания приложения - отступ от верхнего края 25px */}
                <button
                    className={styles.menuButton}
                    onClick={handleCreateAppClick}
                    title="Создать приложение"
                    style={{marginTop: '25px'}}
                >
                    <img src={createAppIcon} alt="Create App" className={styles.iconImage}/>
                </button>
            </div>


            {/* 4. Нижняя панель с кнопками - прижимается к низу */}
            <div className={styles.bottomPanel}>
                {/* Кнопка смены темы */}
                <button
                    className={styles.menuButton}
                    onClick={handleThemeToggle}
                    title="Смена темы"
                >
                    <img src={themeIcon} alt="Theme" className={styles.iconImage}/>
                </button>

                {/* 5. Кнопка настроек - в самом низу с отступом 15px от низа */}
                <button
                    className={styles.menuButton}
                    onClick={handleSettingsClick}
                    title="Настройки"
                    style={{marginTop: '15px'}}
                >
                    <img src={settingsIcon} alt="Settings" className={styles.iconImage}/>
                </button>
            </div>
        </div>
    );
};
