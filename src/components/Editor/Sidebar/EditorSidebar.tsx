import logoIcon from '@/assets/icons/logo.svg';
import { useNavigate } from 'react-router-dom';
import { EditorToolbarButtons, type EditorToolbarButtonsProps } from './EditorToolbarButtons';
import styles from './EditorSidebar.module.css';

type EditorSidebarProps = Omit<EditorToolbarButtonsProps, 'variant'>;

export const EditorSidebar = (props: EditorSidebarProps) => {
    const navigate = useNavigate();

    return (
        <div className={styles.editorSidebar}>
            <div className={styles.logoSection} onClick={() => navigate('/create-app')}>
                <img src={logoIcon} alt="Логотип" className={styles.logoImage} />
            </div>

            <EditorToolbarButtons variant="sidebar" {...props} />
        </div>
    );
};
