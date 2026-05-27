const HEX_SHORT = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_FULL = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export const normalizeHexColor = (color: string, fallback = '#FFFFFF'): string => {
    const value = color.trim();
    if (!value) {
        return fallback;
    }

    const short = value.replace(HEX_SHORT, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);
    const match = short.match(HEX_FULL);
    if (!match) {
        return fallback;
    }

    return `#${match[1]}${match[2]}${match[3]}`.toUpperCase();
};

export const getLuminance = (color: string): number => {
    const hex = normalizeHexColor(color);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const toLinear = (channel: number) =>
        channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

export const isDarkColor = (color: string): boolean => getLuminance(color) < 0.45;

export interface AdaptivePalette {
    text: string;
    icon: string;
    accent: string;
    muted: string;
    avatarBg: string;
    avatarIcon: string;
    avatarBorder: string;
}

export const getAdaptivePalette = (backgroundColor: string): AdaptivePalette => {
    const bg = normalizeHexColor(backgroundColor);
    const dark = isDarkColor(bg);

    if (dark) {
        return {
            text: '#F5F8FC',
            icon: '#B8D4F0',
            accent: '#7EB8FF',
            muted: 'rgba(245, 248, 252, 0.75)',
            avatarBg: 'rgba(255, 255, 255, 0.15)',
            avatarIcon: '#F5F8FC',
            avatarBorder: '#F5F8FC',
        };
    }

    return {
        text: '#1A1A1A',
        icon: '#155DA4',
        accent: '#155DA4',
        muted: 'rgba(26, 26, 26, 0.7)',
        avatarBg: '#E6F2FF',
        avatarIcon: '#155DA4',
        avatarBorder: '#FFFFFF',
    };
};
