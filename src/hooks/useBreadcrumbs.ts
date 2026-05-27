import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
    '/': [{ label: 'Главная' }],
    '/create-app': [
        { label: 'Главная', path: '/' },
        { label: 'Приложения' },
    ],
    '/templates': [
        { label: 'Главная', path: '/' },
        { label: 'Шаблоны' },
    ],
    '/settings': [
        { label: 'Главная', path: '/' },
        { label: 'Настройки' },
    ],
    '/admin': [
        { label: 'Главная', path: '/' },
        { label: 'Админка' },
    ],
};

export const useBreadcrumbs = (): BreadcrumbItem[] => {
    const { pathname } = useLocation();

    return useMemo(() => {
        return ROUTE_BREADCRUMBS[pathname] ?? [{ label: 'Главная', path: '/' }, { label: 'Страница' }];
    }, [pathname]);
};
