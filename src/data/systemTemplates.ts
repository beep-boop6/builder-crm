import type { EditorComponent } from '@/store/editorStore';
import type { ProjectTemplate } from '@/types/template';
import type { TableColumnMapping } from '@/types/data';

type TemplateSeed = Omit<ProjectTemplate, 'createdAt' | 'updatedAt'>;

const whiteData = {
    backgroundColor: '#ffffff',
    color: '#333333',
    borderRadius: 12,
};

const primaryButton = {
    backgroundColor: '#155DA4',
    color: '#ffffff',
    borderRadius: 8,
};

const tableProps = (
    dataSourceId: string,
    mappings: TableColumnMapping[],
    extra?: Record<string, unknown>
) => ({
    dataSourceId,
    columnMappings: mappings,
    pagination: true,
    rowSelection: false,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...extra,
});

const chartProps = (
    dataSourceId: string,
    chartType: 'bar' | 'line',
    xField: string,
    yField: string
) => ({
    dataSourceId,
    chartType,
    chartMapping: { xField, yField },
    xAxisKey: xField,
    yAxisKey: yField,
    backgroundColor: '#FFFFFF',
    style: { color: '#1976d2', backgroundColor: '#FFFFFF' },
    borderWidth: 1,
    borderColor: '#E8E8E8',
});

const filterProps = (
    label: string,
    fieldKey: string,
    filterType: 'status' | 'date' | 'field',
    targetIds: string[],
    extra?: Record<string, unknown>
) => ({
    filterType,
    fieldKey,
    label,
    value: '',
    targetComponentIds: targetIds,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...extra,
});

const comp = (
    id: string,
    type: string,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    props: Record<string, unknown> = {},
    overrides: Partial<EditorComponent> = {}
): EditorComponent => ({
    id,
    type,
    x,
    y,
    width,
    height,
    text,
    zIndex: 1,
    ...whiteData,
    props,
    ...overrides,
});

// ——— Воронка продаж ———
const SALES_PAGE_ID = 'a1000001-0001-4000-8000-000000000001';
const SALES = {
    btnCreate: 'a1000001-0001-4000-8000-000000000011',
    filterStatus: 'a1000001-0001-4000-8000-000000000012',
    tableDeals: 'a1000001-0001-4000-8000-000000000013',
    cardDeal: 'a1000001-0001-4000-8000-000000000014',
    cardClient: 'a1000001-0001-4000-8000-000000000015',
    btnEdit: 'a1000001-0001-4000-8000-000000000016',
    btnDelete: 'a1000001-0001-4000-8000-000000000017',
    chartStatus: 'a1000001-0001-4000-8000-000000000018',
};

const salesFunnelComponents: EditorComponent[] = [
    comp(SALES.btnCreate, 'button', 24, 20, 180, 40, 'Создать сделку', {
        text: 'Создать сделку',
        variant: 'primary',
        targetPageId: '',
    }, primaryButton),
    comp(SALES.filterStatus, 'filter', 220, 20, 340, 72, 'Статус сделки', filterProps(
        'Статус сделки',
        'status',
        'status',
        [SALES.tableDeals, SALES.chartStatus]
    )),
    comp(SALES.tableDeals, 'table', 24, 108, 820, 400, 'Таблица сделок', tableProps('src-deals', [
        { sourceField: 'title', title: 'Название сделки' },
        { sourceField: 'client', title: 'Клиент' },
        { sourceField: 'amount', title: 'Сумма' },
        { sourceField: 'status', title: 'Статус' },
        { sourceField: 'date', title: 'Дата' },
    ]), { zIndex: 2 }),
    comp(SALES.cardDeal, 'card-deal', 860, 108, 300, 168, 'Сделка', {
        dealTitle: 'Поставка оборудования',
        clientName: 'ООО Альфа',
        dealStatus: 'Переговоры',
        dealAmount: '120 000 ₽',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(SALES.cardClient, 'card', 860, 288, 300, 320, 'Иван Иванов', {
        fullName: 'Иван Иванов',
        organization: 'ООО Альфа',
        email: 'ivan@alfa.example.com',
        description: 'Контакт по сделке «Поставка оборудования»',
        photoUrl: '',
        photoId: '',
        phones: [{ id: 'sales-phone-1', number: '+7 (999) 123-45-67' }],
        textAlign: 'left',
        coverType: 'gradient',
        coverColor: '#155DA4',
        coverImageId: '',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(SALES.btnEdit, 'button', 860, 620, 140, 36, 'Редактировать', {
        text: 'Редактировать',
        variant: 'default',
        targetPageId: '',
    }, { backgroundColor: '#f5f5f5', color: '#333333' }),
    comp(SALES.btnDelete, 'button', 1020, 620, 140, 36, 'Удалить', {
        text: 'Удалить',
        variant: 'default',
        targetPageId: '',
    }, { backgroundColor: '#fff1f0', color: '#cf1322' }),
    comp(SALES.chartStatus, 'chart', 24, 524, 820, 260, 'Распределение по статусам', chartProps(
        'src-deals',
        'bar',
        'status',
        'amount'
    ), { zIndex: 2 }),
];

// ——— База клиентов ———
const CLIENTS_PAGE_ID = 'a2000002-0002-4000-8000-000000000002';
const CLIENTS = {
    btnAdd: 'a2000002-0002-4000-8000-000000000021',
    search: 'a2000002-0002-4000-8000-000000000022',
    filterStatus: 'a2000002-0002-4000-8000-000000000023',
    table: 'a2000002-0002-4000-8000-000000000024',
    card: 'a2000002-0002-4000-8000-000000000025',
    btnEdit: 'a2000002-0002-4000-8000-000000000026',
    btnDelete: 'a2000002-0002-4000-8000-000000000027',
    kpiTotal: 'a2000002-0002-4000-8000-000000000028',
    kpiActive: 'a2000002-0002-4000-8000-000000000029',
    kpiNew: 'a2000002-0002-4000-8000-000000000030',
};

const clientsBaseComponents: EditorComponent[] = [
    comp(CLIENTS.btnAdd, 'button', 24, 20, 200, 40, 'Добавить клиента', {
        text: 'Добавить клиента',
        variant: 'primary',
        targetPageId: '',
    }, primaryButton),
    comp(CLIENTS.search, 'form', 240, 20, 420, 56, 'Поиск', {
        formMode: 'search',
        fields: [{ name: 'name', label: 'Поиск клиентов', type: 'text', placeholder: 'Имя, телефон или email' }],
        layout: 'horizontal',
        textAlign: 'left',
        submitLabel: 'Найти',
        formValues: {},
        appliedFormValues: {},
        targetComponentIds: [CLIENTS.table],
        searchFieldKey: 'name',
        searchValue: '',
        appliedSearchValue: '',
        hideBackgroundColor: true,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }, { height: 56 }),
    comp(CLIENTS.filterStatus, 'filter', 680, 20, 300, 72, 'Статус клиента', filterProps(
        'Статус клиента',
        'status',
        'status',
        [CLIENTS.table]
    )),
    comp(CLIENTS.table, 'table', 24, 108, 820, 400, 'Таблица клиентов', tableProps('src-clients', [
        { sourceField: 'name', title: 'Имя' },
        { sourceField: 'phone', title: 'Телефон' },
        { sourceField: 'email', title: 'Электронная почта' },
        { sourceField: 'status', title: 'Статус клиента' },
    ]), { zIndex: 2 }),
    comp(CLIENTS.card, 'card', 860, 108, 300, 360, 'Иван Иванов', {
        fullName: 'Иван Иванов',
        organization: 'ООО «Пример»',
        email: 'ivan@example.com',
        description: 'История: звонок 12.01, встреча 28.01, КП отправлено 05.02',
        photoUrl: '',
        photoId: '',
        phones: [{ id: 'client-phone-1', number: '+7 (999) 123-45-67' }],
        textAlign: 'left',
        coverType: 'gradient',
        coverColor: '#2e7d32',
        coverImageId: '',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(CLIENTS.btnEdit, 'button', 860, 480, 140, 36, 'Редактировать', {
        text: 'Редактировать',
        variant: 'default',
        targetPageId: '',
    }, { backgroundColor: '#f5f5f5', color: '#333333' }),
    comp(CLIENTS.btnDelete, 'button', 1020, 480, 140, 36, 'Удалить', {
        text: 'Удалить',
        variant: 'default',
        targetPageId: '',
    }, { backgroundColor: '#fff1f0', color: '#cf1322' }),
    comp(CLIENTS.kpiTotal, 'card-kpi', 24, 524, 280, 120, 'Всего клиентов', {
        kpiLabel: 'Всего клиентов',
        kpiValue: '248',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(CLIENTS.kpiActive, 'card-kpi', 320, 524, 280, 120, 'Активные', {
        kpiLabel: 'Активные клиенты',
        kpiValue: '186',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(CLIENTS.kpiNew, 'card-kpi', 616, 524, 280, 120, 'Новые за месяц', {
        kpiLabel: 'Новые за месяц',
        kpiValue: '34',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
];

// ——— Финансовая аналитика ———
const FINANCE_PAGE_ID = 'a3000003-0003-4000-8000-000000000003';
const FINANCE = {
    filterPeriod: 'a3000003-0003-4000-8000-000000000031',
    filterType: 'a3000003-0003-4000-8000-000000000033',
    chartIncome: 'a3000003-0003-4000-8000-000000000034',
    tableTx: 'a3000003-0003-4000-8000-000000000035',
    cardSummary: 'a3000003-0003-4000-8000-000000000036',
    kpiBest: 'a3000003-0003-4000-8000-000000000037',
    kpiWorst: 'a3000003-0003-4000-8000-000000000038',
    kpiAvg: 'a3000003-0003-4000-8000-000000000039',
};

const financeTargets = [FINANCE.chartIncome, FINANCE.tableTx];

const financeComponents: EditorComponent[] = [
    comp(FINANCE.filterPeriod, 'filter', 24, 20, 460, 72, 'Период', filterProps(
        'Период (дата от / до)',
        'date',
        'date',
        financeTargets,
        { value: '2026-01-01', valueTo: '2026-12-31' }
    )),
    comp(FINANCE.filterType, 'filter', 500, 20, 280, 72, 'Тип операции', filterProps(
        'Доходы / расходы',
        'type',
        'field',
        financeTargets
    )),
    comp(FINANCE.chartIncome, 'chart', 24, 108, 820, 280, 'График доходов', chartProps(
        'src-sales',
        'line',
        'month',
        'amount'
    ), { zIndex: 2 }),
    comp(FINANCE.tableTx, 'table', 24, 404, 820, 220, 'Транзакции', tableProps('src-transactions', [
        { sourceField: 'date', title: 'Дата' },
        { sourceField: 'type', title: 'Тип операции' },
        { sourceField: 'amount', title: 'Сумма' },
        { sourceField: 'category', title: 'Категория' },
    ]), { zIndex: 2 }),
    comp(FINANCE.cardSummary, 'card-summary', 860, 108, 300, 200, 'Итоги', {
        totalIncome: '1 250 000 ₽',
        totalExpense: '820 000 ₽',
        profit: '430 000 ₽',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(FINANCE.kpiBest, 'card-kpi', 24, 640, 280, 120, 'Лучший месяц', {
        kpiLabel: 'Лучший месяц',
        kpiValue: 'Март — 240 000 ₽',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(FINANCE.kpiWorst, 'card-kpi', 320, 640, 280, 120, 'Худший месяц', {
        kpiLabel: 'Худший месяц',
        kpiValue: 'Апрель — 45 000 ₽',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
    comp(FINANCE.kpiAvg, 'card-kpi', 616, 640, 280, 120, 'Средний доход', {
        kpiLabel: 'Средний доход',
        kpiValue: '153 000 ₽ / мес',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    }),
];

/** Системные шаблоны проектов по §2.7 ТЗ. */
export const SYSTEM_TEMPLATES: TemplateSeed[] = [
    {
        id: 'system-sales-funnel',
        name: 'Воронка продаж',
        type: 'dashboard',
        navigationType: 'sidebar',
        pages: [{
            id: SALES_PAGE_ID,
            title: 'Воронка продаж',
            route: '/deals',
            order: 1,
            components: salesFunnelComponents,
        }],
    },
    {
        id: 'system-clients-base',
        name: 'База клиентов',
        type: 'list',
        navigationType: 'sidebar',
        pages: [{
            id: CLIENTS_PAGE_ID,
            title: 'База клиентов',
            route: '/clients',
            order: 1,
            components: clientsBaseComponents,
        }],
    },
    {
        id: 'system-finance-analytics',
        name: 'Финансовая аналитика',
        type: 'report',
        navigationType: 'topbar',
        pages: [{
            id: FINANCE_PAGE_ID,
            title: 'Финансовая аналитика',
            route: '/finance',
            order: 1,
            components: financeComponents,
        }],
    },
];
