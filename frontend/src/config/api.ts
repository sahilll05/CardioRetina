import axios from 'axios';
import { useAuthStore } from '@/auth/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_URL = `${API_BASE_URL}/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — attach session token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['X-Session-Token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle auth expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized — log out and redirect
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Multipart form helper for file uploads */
export const apiUpload = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 min for analysis upload
});

apiUpload.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['X-Session-Token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
