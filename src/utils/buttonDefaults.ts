import type { ButtonProps } from '@/types/button';

export const DEFAULT_BUTTON_PROPS: ButtonProps = {
    targetPageId: '',
    variant: 'primary',
    size: 'middle',
};

export const normalizeButtonProps = (raw: Record<string, unknown> | undefined): ButtonProps => ({
    targetPageId: String(raw?.targetPageId ?? DEFAULT_BUTTON_PROPS.targetPageId),
    variant: String(raw?.variant ?? DEFAULT_BUTTON_PROPS.variant),
    size: String(raw?.size ?? DEFAULT_BUTTON_PROPS.size),
});
