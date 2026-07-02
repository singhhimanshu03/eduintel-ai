import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from './store';
import { logout, setTokens } from '../features/auth/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: JWT refresh on 401 ─────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processPendingQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auth endpoints: bypass refresh logic for ALL error statuses.
    // A 401 on /auth/login means bad credentials; a 403 means account locked.
    // Return the raw AxiosError so callers receive error.response.data.message intact.
    const url = original?.url ?? '';
    if (url.startsWith('/auth/') || url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // Queue subsequent 401s while a refresh is in-flight
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (original.headers) original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      const refreshToken = store.getState().auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken: string = data.data.accessToken;

        store.dispatch(setTokens({ accessToken: newAccessToken, refreshToken }));
        processPendingQueue(null, newAccessToken);

        if (original.headers) original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        processPendingQueue(refreshError);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standardize error shape — attach response so callers reading .response.data.message work
    const msg =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'An unexpected error occurred';

    const standardized: Error & { status?: number; response?: typeof error.response } =
      Object.assign(new Error(msg), {
        status:   error.response?.status,
        response: error.response,
      });
    return Promise.reject(standardized);
  }
);

export default api;
