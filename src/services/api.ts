import axios from 'axios';
import type { AxiosError, Method } from 'axios';
import {message} from 'antd';
import { apiBaseUrl, backendBaseUrl } from '@/config/env';
import { getErrorMessage } from '@/utils/getErrorMessage';

export const apiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const rootApiClient = axios.create({
    baseURL: backendBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

const attachResponseInterceptor = (client: typeof apiClient) => {
    client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            const skipToast = error.config?.headers?.['X-Skip-Error-Toast'] === 'true';
            const method = error.config?.method?.toUpperCase() || 'REQUEST';
            const url = error.config?.url || 'unknown-url';
            const details = getErrorMessage(error);
            console.error(`[API ${method}] ${url}: ${details}`, error);

            if (!skipToast) {
                message.error(details);
            }

            return Promise.reject(error);
        }
    );
};

attachResponseInterceptor(apiClient);
attachResponseInterceptor(rootApiClient);

type FallbackRequestOptions<TData = unknown> = {
    method: Method;
    paths: string[];
    data?: TData;
};

export const requestWithFallback = async <TResponse, TData = unknown>(
    options: FallbackRequestOptions<TData>
): Promise<TResponse> => {
    const { method, paths, data } = options;
    let lastError: unknown;

    for (let index = 0; index < paths.length; index += 1) {
        try {
            const response = await apiClient.request<TResponse>({
                method,
                url: paths[index],
                data,
            });
            return response.data;
        } catch (error) {
            lastError = error;
            const status = (error as AxiosError).response?.status;
            const hasMoreFallbacks = index < paths.length - 1;
            const shouldRetryOnFallback = hasMoreFallbacks && [404, 405].includes(status || 0);

            if (!shouldRetryOnFallback) {
                throw error;
            }
        }
    }

    throw lastError || new Error('Запрос к API не выполнен');
};
