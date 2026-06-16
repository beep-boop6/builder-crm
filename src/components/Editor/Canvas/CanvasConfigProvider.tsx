import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';
import { BRAND_PRIMARY } from '@/constants/brandColors';

interface CanvasConfigProviderProps {
    children: ReactNode;
}

/** Компоненты на холсте всегда в светлой теме Ant Design — у них свой фон и цвета. */
export const CanvasConfigProvider = ({ children }: CanvasConfigProviderProps) => (
    <ConfigProvider
        locale={ruRU}
        theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
                colorPrimary: BRAND_PRIMARY,
                colorBgContainer: '#ffffff',
                colorBgElevated: '#f7f8fa',
                colorBgLayout: '#ffffff',
                colorText: '#1a1a1a',
                colorTextSecondary: '#595959',
                colorTextHeading: '#1a1a1a',
                colorTextPlaceholder: '#8c8c8c',
                colorBorder: '#d9d9d9',
            },
            components: {
                Select: {
                    optionSelectedBg: '#e8f1fa',
                    optionActiveBg: '#f0f5fb',
                    colorBgElevated: '#f7f8fa',
                },
                DatePicker: {
                    colorBgElevated: '#f7f8fa',
                },
            },
        }}
    >
        {children}
    </ConfigProvider>
);
