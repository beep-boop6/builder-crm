export const COMPONENT_CATEGORIES = [
    { id: 'all', label: 'Все категории' },
    { id: 'basic', label: 'Базовые' },
    { id: 'data', label: 'Данные' },
    { id: 'input', label: 'Ввод' },
    { id: 'layout', label: 'Макет' },
    { id: 'custom', label: 'Пользовательские' },
] as const;

export type ComponentCategoryId = typeof COMPONENT_CATEGORIES[number]['id'];

export const getCategoryLabel = (categoryId: string): string =>
    COMPONENT_CATEGORIES.find((category) => category.id === categoryId)?.label ?? categoryId;
