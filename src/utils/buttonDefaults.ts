import type { CSSProperties } from 'react';
import type { ButtonProps } from '@/types/button';

export const DEFAULT_BUTTON_PROPS: ButtonProps = {
    targetPageId: '',
    variant: 'primary',
    size: 'middle',
};

export type ButtonVariant = 'primary' | 'default' | 'dashed';
export type ButtonSize = 'small' | 'middle' | 'large';

export const BUTTON_VARIANT_STYLES: Record<ButtonVariant, Pick<CSSProperties, 'backgroundColor' | 'color' | 'border'>> = {
    primary: {
        backgroundColor: '#155DA4',
        color: '#ffffff',
        border: 'none',
    },
    default: {
        backgroundColor: '#ffffff',
        color: '#333333',
        border: '1px solid #d9d9d9',
    },
    dashed: {
        backgroundColor: '#ffffff',
        color: '#155DA4',
        border: '1px dashed #155DA4',
    },
};

export const BUTTON_SIZE_STYLES: Record<ButtonSize, Pick<CSSProperties, 'fontSize' | 'padding'>> = {
    small: { fontSize: 12, padding: '0 10px' },
    middle: { fontSize: 14, padding: '0 12px' },
    large: { fontSize: 16, padding: '0 16px' },
};

export const BUTTON_SIZE_HEIGHT: Record<ButtonSize, number> = {
    small: 32,
    middle: 40,
    large: 48,
};

export const normalizeButtonProps = (raw: Record<string, unknown> | undefined): ButtonProps => ({
    targetPageId: String(raw?.targetPageId ?? DEFAULT_BUTTON_PROPS.targetPageId),
    variant: String(raw?.variant ?? DEFAULT_BUTTON_PROPS.variant),
    size: String(raw?.size ?? DEFAULT_BUTTON_PROPS.size),
});

export const getButtonVariantStyle = (variant: string) =>
    BUTTON_VARIANT_STYLES[variant as ButtonVariant] ?? BUTTON_VARIANT_STYLES.primary;

export const getButtonSizeStyle = (size: string) =>
    BUTTON_SIZE_STYLES[size as ButtonSize] ?? BUTTON_SIZE_STYLES.middle;
