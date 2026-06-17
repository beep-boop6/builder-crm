import type { ReactNode } from 'react';
import addIcon from '@/assets/icons/add.svg';
import pagesIcon from '@/assets/icons/pages.svg';
import previewIcon from '@/assets/icons/preview.svg';
import saveIcon from '@/assets/icons/save.svg';
import templateIcon from '@/assets/icons/template.svg';
import settingsIcon from '@/assets/icons/settings.svg';
import styles from './EditorSidebar.module.css';

export interface EditorToolbarButtonsProps {
    variant: 'sidebar' | 'topbar';
    onToggleLibrary: () => void;
    onTogglePages: () => void;
    onSave: () => void;
    onSaveAsTemplate: () => void;
    onPreview: () => void;
    onOpenSettings: () => void;
    isLibraryOpen?: boolean;
    isPagesOpen?: boolean;
    saving?: boolean;
}

type ToolbarButtonKey = 'library' | 'pages' | 'preview' | 'save' | 'template' | 'settings';

const SIDEBAR_ORDER: ToolbarButtonKey[] = [
    'library',
    'pages',
    'preview',
    'save',
    'template',
    'settings',
];

const TOPBAR_ORDER: ToolbarButtonKey[] = [
    'save',
    'preview',
    'library',
    'pages',
    'template',
    'settings',
];

export const EditorToolbarButtons = ({
    variant,
    onToggleLibrary,
    onTogglePages,
    onSave,
    onSaveAsTemplate,
    onPreview,
    onOpenSettings,
    isLibraryOpen = false,
    isPagesOpen = false,
    saving = false,
}: EditorToolbarButtonsProps) => {
    const order = variant === 'topbar' ? TOPBAR_ORDER : SIDEBAR_ORDER;

    const buttons: Record<ToolbarButtonKey, ReactNode> = {
        library: (
            <button
                key="library"
                type="button"
                className={`${styles.menuButton} ${isLibraryOpen ? styles.menuButtonActive : ''}`}
                onClick={onToggleLibrary}
                title="Библиотека компонентов"
            >
                <img src={addIcon} alt="" className={styles.iconImage} />
            </button>
        ),
        pages: (
            <button
                key="pages"
                type="button"
                className={`${styles.menuButton} ${isPagesOpen ? styles.menuButtonActive : ''}`}
                onClick={onTogglePages}
                title="Страницы"
            >
                <img src={pagesIcon} alt="" className={styles.iconImageSmall} />
            </button>
        ),
        preview: (
            <button
                key="preview"
                type="button"
                className={styles.menuButton}
                onClick={onPreview}
                title="Предпросмотр"
            >
                <img src={previewIcon} alt="" className={styles.iconImageSmall} />
            </button>
        ),
        save: (
            <button
                key="save"
                type="button"
                className={styles.menuButton}
                onClick={onSave}
                disabled={saving}
                title={saving ? 'Сохранение...' : 'Сохранить'}
            >
                <img src={saveIcon} alt="" className={styles.iconImageSmall} />
            </button>
        ),
        template: (
            <button
                key="template"
                type="button"
                className={styles.menuButton}
                onClick={onSaveAsTemplate}
                title="Сохранить как шаблон"
            >
                <img src={templateIcon} alt="" className={styles.iconImageSmall} />
            </button>
        ),
        settings: (
            <button
                key="settings"
                type="button"
                className={styles.menuButton}
                onClick={onOpenSettings}
                title="Настройки"
            >
                <img src={settingsIcon} alt="" className={styles.iconImage} />
            </button>
        ),
    };

    return (
        <div
            className={`${styles.toolbar} ${variant === 'topbar' ? styles.toolbarHorizontal : ''}`}
            role="toolbar"
            aria-label="Панель инструментов редактора"
        >
            {order.map((key) => buttons[key])}
        </div>
    );
};
