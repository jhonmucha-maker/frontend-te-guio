import axios from 'axios';
import { API_URL, AUTH_ERROR_CODES, SSE_EVENTS } from '../utils/constants';
import { sseEventBus } from './sseEventBus';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para agregar token y manejar Content-Type
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Si el body es FormData, eliminar Content-Type para que axios/browser
  // lo setee automaticamente con el boundary correcto (critico para CapacitorHttp)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Control para evitar multiples refresh simultaneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para manejar errores de autenticacion con refresh automatico
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si la cuenta fue inhabilitada (403 ACCOUNT_DISABLED): notificar via bus y rechazar
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === AUTH_ERROR_CODES.ACCOUNT_DISABLED
    ) {
      sseEventBus.emit(SSE_EVENTS.ACCOUNT_DISABLED, {
        message: error.response.data.message,
      });
      return Promise.reject(error);
    }

    // Si es 401 y no es un retry ni es el endpoint de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        processQueue(null, data.token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('usuario');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Validación coordinada de token para SSE y otros consumidores no-axios.
// Comparte el lock isRefreshing/failedQueue con el interceptor para evitar
// refreshes concurrentes que invaliden tokens en vuelo.
export async function getValidToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 - Date.now() > 60000) return token;
  } catch {
    return token;
  }

  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) return null;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: storedRefreshToken,
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    processQueue(null, data.token);
    return data.token;
  } catch (err) {
    processQueue(err, null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    return null;
  } finally {
    isRefreshing = false;
  }
}

export default apiClient;
