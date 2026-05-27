import { useNavigate } from 'react-router-dom';
import { DataSourcesManager } from '@/components/DataSources/DataSourcesManager';
import styles from './Settings.module.css';

const SettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <header className={styles.header}>
                    <div className={styles.headerText}>
                        <h1 className={styles.title}>Настройки</h1>
                        <p className={styles.subtitle}>
                            Здесь вы подключаете данные для таблиц и графиков в ваших приложениях.
                            Ничего сложного — укажите название и откуда брать информацию.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={() => navigate('/')}
                    >
                        На главную
                    </button>
                </header>

                <DataSourcesManager />
            </div>
        </div>
    );
};

export default SettingsPage;
