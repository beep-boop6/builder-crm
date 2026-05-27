import type { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown, fallback = 'Неизвестная ошибка'): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
    }

    if (axiosError.code === 'ECONNABORTED') {
        return 'Сервер не ответил вовремя';
    }

    if (axiosError.request && !axiosError.response) {
        return 'Не удалось подключиться к серверу';
    }

    if (axiosError.response?.status) {
        return `Ошибка сервера (${axiosError.response.status})`;
    }

    return fallback;
};
