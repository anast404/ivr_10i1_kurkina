import useAuthStore from '@/state/auth';
import logout from '@/utils/auth';
import axios, { isAxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // токен просрочен или недействителен: возвращаем пользователя на экран входа
    if (isAxiosError(error) && error.response?.status === 401 && useAuthStore.getState().token) {
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
