import type { CSSProperties, MouseEvent } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import type { Page } from '@/types';
import { getButtonSizeStyle, getButtonVariantStyle, normalizeButtonProps } from '@/utils/buttonDefaults';
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
    const variantStyle = getButtonVariantStyle(buttonProps.variant);
    const sizeStyle = getButtonSizeStyle(buttonProps.size);
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
        backgroundColor: component.backgroundColor ?? variantStyle.backgroundColor,
        borderRadius: `${component.borderRadius ?? 8}px`,
        color: component.color ?? variantStyle.color,
        fontSize: component.fontSize ? `${component.fontSize}px` : sizeStyle.fontSize,
        fontWeight: component.fontWeight ?? 600,
        fontFamily: 'Raleway, sans-serif',
        border: variantStyle.border,
        padding: sizeStyle.padding,
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
