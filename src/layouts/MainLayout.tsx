import { SideMenu } from '@/components/Common/Menu/SideMenu';
import { AppHeader } from '@/components/Common/Header/AppHeader';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export const MainLayout = () => {
    return (
        <div className={styles.layout}>
            <SideMenu />
            <div className={styles.mainColumn}>
                <AppHeader />
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
