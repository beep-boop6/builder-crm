import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import themeLightIcon from '@/assets/icons/theme-light.svg';
import themeDarkIcon from '@/assets/icons/theme-dark.svg';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useUIStore } from '@/store/uiStore';
import { BreadcrumbSeparator } from '@/components/Common/BreadcrumbSeparator';
import styles from './AppHeader.module.css';

export const AppHeader = () => {
    const navigate = useNavigate();
    const breadcrumbs = useBreadcrumbs();
    const toggleTheme = useUIStore((state) => state.toggleTheme);
    const themeMode = useUIStore((state) => state.theme);
    const themeIcon = themeMode === 'dark' ? themeDarkIcon : themeLightIcon;

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

            <button
                type="button"
                className={styles.themeButton}
                onClick={toggleTheme}
                title="Смена темы"
            >
                <img src={themeIcon} alt="" className={styles.themeIcon} />
            </button>
        </header>
    );
};
