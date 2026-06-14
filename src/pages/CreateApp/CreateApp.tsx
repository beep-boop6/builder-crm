import {useState, useRef, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Alert} from 'antd';
import CreateAppPopup from '@/components/CreateAppPopup/CreateAppPopup';
import {useProjectStore} from '@/store/projectStore';
import arrowIcon from '@/assets/icons/arrow.svg';
import styles from './CreateApp.module.css';
import type {Project} from '@/types';

const CreateApp = () => {
    const navigate = useNavigate();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const {projects, fetchProjects, setCurrentProject, deleteProject, error} = useProjectStore();

    // Загружаем проекты при монтировании
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Проверяем, нужно ли показывать стрелки
    useEffect(() => {
        const checkOverflow = () => {
            if (carouselRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
                setShowLeftArrow(scrollLeft > 0);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
            }
        };
        
        checkOverflow();
        const carousel = carouselRef.current;
        if (carousel) {
            carousel.addEventListener('scroll', checkOverflow);
            window.addEventListener('resize', checkOverflow);
        }
        
        return () => {
            if (carousel) {
                carousel.removeEventListener('scroll', checkOverflow);
            }
            window.removeEventListener('resize', checkOverflow);
        };
    }, [projects]);

    const handleCreateClick = () => {
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
    };

    const handleTemplatesClick = () => {
        navigate('/templates');
    };

    const handleProjectClick = (project: Project) => {
        setCurrentProject(project);
        navigate(`/builder/${project.id}`);
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
            try {
                await deleteProject(projectId);
            } catch (error) {
                console.error('Ошибка при удалении проекта:', error);
            }
        }
    };

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({left: -220, behavior: 'smooth'});
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({left: 220, behavior: 'smooth'});
        }
    };

    return (
        <div className={styles.container}>
            {error && (
                <Alert
                    type="error"
                    showIcon
                    title="Ошибка загрузки проектов"
                    description={error}
                    style={{ marginBottom: 16 }}
                />
            )}
            {/* Block 1: Welcome Section */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.title}>
                    Добро пожаловать в рабочее пространство 66<span className={styles.titleItalic}>бит</span>
                </h1>
                <p className={styles.description}>
                    Вы можете начать делать приложение с нуля или выбрать нужный вам шаблон из библиотеки
                </p>
                <button className={styles.createButton} onClick={handleCreateClick}>
                    Создать приложение
                </button>
            </div>

            {/* Block 2: Projects Section */}
            <div className={styles.projectsSection}>
                <h2 className={styles.projectsTitle}>Проекты</h2>
                <div className={styles.carouselContainer}>
                    {showLeftArrow && (
                        <button
                            className={styles.arrowButton}
                            onClick={scrollLeft}
                        >
                            <img src={arrowIcon} alt="" className={styles.arrowIcon} />
                        </button>
                    )}
                    <div className={styles.carousel} ref={carouselRef}>
                        {projects.map((project) => (
                            <div 
                                key={project.id} 
                                className={styles.projectCard}
                                onClick={() => handleProjectClick(project)}
                            >
                                <button
                                    className={styles.deleteButton}
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    title="Удалить проект"
                                >
                                    <img src="/src/assets/icons/delete.svg" alt="Delete" width={16} height={16} />
                                </button>
                                <div className={styles.projectIcon}>
                                    📁
                                </div>
                                <p className={styles.projectName}>{project.name}</p>
                            </div>
                        ))}
                    </div>

                    {showRightArrow && (
                        <button
                            className={styles.arrowButton}
                            onClick={scrollRight}
                        >
                            <img src={arrowIcon} alt="" className={`${styles.arrowIcon} ${styles.arrowRight}`} />
                        </button>
                    )}
                </div>
                <button className={styles.templatesButton} onClick={handleTemplatesClick}>
                    Посмотреть шаблоны
                </button>
            </div>
            {/* Popup Modal */}
            <CreateAppPopup
                isOpen={isPopupOpen}
                onClose={handleClosePopup}
            />
        </div>
    );
};

export default CreateApp;
