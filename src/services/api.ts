import axios from 'axios';
import {message} from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        message.error(error.response?.data?.message || 'Ошибка сервера');
        return Promise.reject(error);
    }
);
