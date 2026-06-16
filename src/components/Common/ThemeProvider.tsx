import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';
import { useUIStore } from '@/store/uiStore';
import { BRAND_PRIMARY } from '@/constants/brandColors';

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const themeMode = useUIStore((state) => state.theme);
    const isDark = themeMode === 'dark';

    return (
        <ConfigProvider
            locale={ruRU}
            theme={{
                algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: BRAND_PRIMARY,
                    ...(isDark
                        ? {
                              colorBgContainer: '#272F44',
                              colorBgElevated: '#596480',
                              colorBgLayout: '#272F44',
                              colorBorder: 'rgba(255, 255, 255, 0.25)',
                              colorText: '#ECECEC',
                              colorTextSecondary: 'rgba(236, 236, 236, 0.72)',
                              colorTextPlaceholder: 'rgba(236, 236, 236, 0.45)',
                          }
                        : {}),
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
};
