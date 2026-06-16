/** Русские подписи для типовых полей данных (ключи колонок не меняем). */
const FIELD_LABELS: Record<string, string> = {
    id: 'Id',
    name: 'Имя',
    title: 'Название',
    email: 'Электронная почта',
    phone: 'Телефон',
    role: 'Роль',
    status: 'Статус',
    type: 'Тип',
    amount: 'Сумма',
    date: 'Дата',
    month: 'Месяц',
    client: 'Клиент',
    category: 'Категория',
    value: 'Значение',
    header: 'Заголовок',
    organization: 'Организация',
    description: 'Описание',
    profit: 'Прибыль',
    totalIncome: 'Доход',
    totalExpense: 'Расход',
};

/** Русские подписи для типовых значений в ячейках и фильтрах. */
const VALUE_LABELS: Record<string, string> = {
    active: 'Активный',
    inactive: 'Неактивный',
    new: 'Новый',
    lead: 'Лид',
    negotiation: 'Переговоры',
    deal: 'Сделка',
    closed: 'Закрыто',
    income: 'Доход',
    expense: 'Расход',
    Admin: 'Администратор',
    Manager: 'Менеджер',
    Client: 'Клиент',
};

export const formatFieldLabel = (field: string): string =>
    FIELD_LABELS[field] ?? field;

export const formatDisplayValue = (value: string): string =>
    VALUE_LABELS[value] ?? value;
