import navigateArrowIcon from '@/assets/icons/navigate-arrow.svg';
import styles from './BreadcrumbSeparator.module.css';

export const BreadcrumbSeparator = () => (
    <img
        src={navigateArrowIcon}
        alt=""
        className={styles.separator}
        width={20}
        height={20}
        aria-hidden
    />
);
