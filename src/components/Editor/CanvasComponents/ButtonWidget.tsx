import type { CSSProperties, MouseEvent } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import type { Page } from '@/types';
import { normalizeButtonProps } from '@/utils/buttonDefaults';
import styles from './ButtonWidget.module.css';

interface ButtonWidgetProps {
    component: EditorComponent;
    readonly: boolean;
    pages: Page[];
    currentPageId: string | null;
    onNavigate: (pageId: string) => void;
}

export const ButtonWidget = ({
    component,
    readonly,
    pages,
    currentPageId,
    onNavigate,
}: ButtonWidgetProps) => {
    const buttonProps = normalizeButtonProps(component.props);
    const targetPage = pages.find((page) => page.id === buttonProps.targetPageId);
    const canNavigate =
        readonly && Boolean(buttonProps.targetPageId) && Boolean(targetPage);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        if (!canNavigate || !buttonProps.targetPageId) {
            return;
        }

        event.stopPropagation();
        if (buttonProps.targetPageId !== currentPageId) {
            onNavigate(buttonProps.targetPageId);
        }
    };

    const buttonStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: component.backgroundColor,
        borderRadius: `${component.borderRadius ?? 8}px`,
        color: component.color || '#ffffff',
        fontSize: `${component.fontSize ?? 14}px`,
        fontWeight: component.fontWeight ?? 600,
        fontFamily: 'Raleway, sans-serif',
        border: 'none',
        cursor: canNavigate ? 'pointer' : readonly ? 'default' : 'pointer',
    };

    return (
        <button
            type="button"
            className={styles.button}
            style={buttonStyle}
            onClick={handleClick}
            title={
                canNavigate && targetPage
                    ? `Перейти на «${targetPage.title}»`
                    : undefined
            }
        >
            {component.text || 'Кнопка'}
        </button>
    );
};
