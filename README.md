# BuilderCRM — Frontend

Визуальный конструктор CRM-приложений: создание проектов, drag-and-drop редактор страниц, привязка данных к таблицам и графикам, предпросмотр и работа с шаблонами.

## Стек

| Категория | Технологии |
|-----------|------------|
| Язык / сборка | TypeScript, Vite 8 |
| UI | React 19, Ant Design 6 |
| Маршрутизация | React Router 7 |
| Состояние | Zustand |
| HTTP | Axios (REST) |
| Real-time | SignalR |
| Редактор | react-rnd, @dnd-kit |
| Графики | Chart.js, react-chartjs-2 |
| Стили | CSS Modules, CSS-переменные |

## Архитектура

Фронтенд построен в три слоя:

1. **UI (слой представления)** — страницы и компоненты редактора. Отображают данные и передают действия пользователя дальше, без прямых запросов к серверу.
2. **Stores (управление состоянием)** — Zustand-хранилища (`projectStore`, `editorStore`, `dataStore` и др.). Держат актуальное состояние и обеспечивают быстрый отклик интерфейса.
3. **Services (интеграция)** — сервисы (`projectService`, `elementService`, `signalrService` и др.). Обращаются к REST API и SignalR Hub.

```
UI → Stores → Services → Backend (REST / SignalR)
```

## Требования

- Node.js 20+
- npm 10+
- Запущенный backend BuilderCRM (по умолчанию `http://localhost:5203`)

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env.development

# Запуск dev-сервера
npm run dev
```

Приложение откроется на адресе, который выведет Vite (обычно `http://localhost:5173`).

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `VITE_API_URL` | Базовый URL бэкенда **без** `/api` | `http://localhost:5203` |
| `VITE_USE_MOCK` | Работа без бэкенда (localStorage) | `false` в production-сборке |

Пример `.env.development`:

```env
VITE_API_URL=http://localhost:5203
VITE_USE_MOCK=false
```

REST-запросы идут на `{VITE_API_URL}/api`, SignalR — на `{VITE_API_URL}/crmConstructorHub`.

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер с HMR |
| `npm run build` | Production-сборка (`tsc` + Vite) |
| `npm run preview` | Просмотр production-сборки |
| `npm run lint` | ESLint |

## Маршруты

| URL | Экран |
|-----|-------|
| `/` | Главная |
| `/create-app` | Рабочее пространство и список проектов |
| `/templates` | Выбор шаблона |
| `/builder/:projectId` | Редактор |
| `/builder/:projectId/preview` | Предпросмотр |
| `/admin` | Управление библиотекой компонентов |

Настройки проекта (название, тип меню, источники данных) доступны **только в редакторе** — через иконку настроек в панели инструментов.

## Структура проекта

```
src/
├── pages/              # Страницы-маршруты
├── layouts/            # MainLayout (меню + шапка)
├── components/
│   ├── Editor/         # Редактор: Canvas, Library, Properties, Header
│   ├── Common/         # Меню, шапка, тема
│   └── DataSources/    # Менеджер источников данных
├── store/              # Zustand stores
├── services/           # REST, SignalR, mock
├── hooks/              # Кастомные React-хуки
├── utils/              # Бизнес-логика без UI
├── styles/             # theme.css — дизайн-токены
├── types/              # TypeScript-типы
└── config/env.ts       # URL API и флаги
```

## Основные stores

| Store | Назначение |
|-------|------------|
| `projectStore` | Проекты, текущий проект, настройки |
| `editorStore` | Холст, страницы, undo/redo, сохранение |
| `componentStore` | Библиотека типов компонентов |
| `dataStore` | Источники данных (persist в localStorage) |
| `templateStore` | Пользовательские шаблоны |
| `uiStore` | Тема light/dark |

## Тема оформления

Переключатель в шапке (`AppHeader`) меняет `data-theme` на `<html>`. Токены определены в `src/styles/theme.css`.

Холст редактора использует отдельный светлый Ant Design ConfigProvider (`CanvasConfigProvider`), чтобы компоненты на белом фоне оставались читаемыми в тёмной теме интерфейса.

## Сборка для production

```bash
npm run build
```

Артеfactы — в папке `dist/`. Для деплоя настройте `VITE_API_URL` на адрес production-бэкенда.
