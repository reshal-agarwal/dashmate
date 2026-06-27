import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        setAuthToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): ApiError['error'] => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      requestId: error.config?.headers?.['X-Request-ID'] as string || '',
    };
  }
  
  return {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    requestId: '',
  };
};

export const isApiSuccess = <T>(response: ApiResponse<T>): response is { success: true; data: T } => {
  return response.success === true;
};

export const isApiError = (response: ApiResponse<any>): response is Extract<ApiResponse<any>, { success: false }> => {
  return response.success === false;
};