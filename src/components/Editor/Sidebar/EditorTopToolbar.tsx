import { EditorToolbarButtons, type EditorToolbarButtonsProps } from './EditorToolbarButtons';
import styles from './EditorTopToolbar.module.css';

type EditorTopToolbarProps = Omit<EditorToolbarButtonsProps, 'variant'>;

export const EditorTopToolbar = (props: EditorTopToolbarProps) => (
    <div className={styles.topToolbar}>
        <EditorToolbarButtons variant="topbar" {...props} />
    </div>
);
