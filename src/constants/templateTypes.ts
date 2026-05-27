export const TEMPLATE_TYPES = [
    { id: 'all', label: 'Все типы' },
    { id: 'dashboard', label: 'Дашборд' },
    { id: 'list', label: 'Список' },
    { id: 'detail', label: 'Карточка' },
    { id: 'form', label: 'Форма' },
    { id: 'report', label: 'Отчёт' },
    { id: 'custom', label: 'Другое' },
] as const;

export type TemplateTypeId = (typeof TEMPLATE_TYPES)[number]['id'];

export const getTemplateTypeLabel = (typeId: string): string =>
    TEMPLATE_TYPES.find((type) => type.id === typeId)?.label ?? typeId;
