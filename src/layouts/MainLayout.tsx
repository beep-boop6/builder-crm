import {SideMenu} from '@/components/Common/Menu/SideMenu';
import {Outlet} from 'react-router-dom';
import styles from './Layout.module.css';

export const MainLayout = () => {
    return (
        <div className={styles.layout}>
            <SideMenu/>
            <main className={styles.mainContent}>
                <Outlet/>
            </main>
        </div>
    );
};
