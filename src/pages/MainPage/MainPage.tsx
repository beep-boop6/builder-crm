import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import CreateAppPopup from '@/components/CreateAppPopup/CreateAppPopup';
import styles from './MainPage.module.css';

const MainPage = () => {
    const navigate = useNavigate();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleCreateClick = () => {
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
    };

    const handleTemplateClick = () => {
        navigate('/templates');
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Выберите опцию</h1>

            <div className={styles.containerButtons}>
                <button className={styles.createButton} onClick={handleCreateClick}>
                    <img src="/src/assets/icons/edit_no_active-light.svg" alt="Редактирование" className={styles.buttonIcon}/>
                    <h3 className={styles.buttonTitle}>Создать пустое приложение</h3>
                    <p className={styles.buttonDescription}>
                        Создавайте собственные приложения для повышения эффективности
                    </p>
                </button>

                <button className={styles.createButton} onClick={handleTemplateClick}>
                    <img src="/src/assets/icons/template.svg" alt="Шаблон" className={styles.buttonIcon}/>
                    <h3 className={styles.buttonTitle}>Выбрать удобный шаблон</h3>
                    <p className={styles.buttonDescription}>
                        Приступайте к работе с готовыми вариантами проектов
                    </p>
                </button>
            </div>

            <CreateAppPopup
                isOpen={isPopupOpen}
                onClose={handleClosePopup}
            />
        </div>
    );
};

export default MainPage;
