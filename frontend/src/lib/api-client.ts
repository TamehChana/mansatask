import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

// Determine backend URL based on current hostname
const getBackendUrl = (): string => {
  // If explicitly set in env, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in browser, detect the hostname and use it for backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing via network IP, use that IP for backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000/api`;
    }
  }

  // Default to localhost
  return 'http://localhost:3000/api';
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from Zustand store localStorage
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const authState = JSON.parse(authStorage);
          const token = authState?.state?.accessToken;

          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        // Invalid storage format, continue without token
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            try {
              const authState = JSON.parse(authStorage);
              const refreshToken = authState?.state?.refreshToken;

              if (refreshToken) {
                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
                  { refreshToken },
                );

                const { accessToken } = response.data;

                if (accessToken) {
                  // Update Zustand store via localStorage
                  const updatedState = {
                    ...authState,
                    state: {
                      ...authState.state,
                      accessToken,
                    },
                  };
                  localStorage.setItem('auth-storage', JSON.stringify(updatedState));

                  // Retry original request with new token
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  }

                  return apiClient(originalRequest);
                }
              }
            } catch (e) {
              // Invalid storage, continue to logout
            }
          }
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Transform error to user-friendly message
    const userFriendlyMessage = getUserFriendlyErrorMessage(error);
    
    // Create a user-friendly error that won't trigger browser error icons
    // All technical details are hidden from users
    const userFriendlyError = new Error(userFriendlyMessage);
    
    // Mark this as a user-friendly error to prevent browser error icons
    (userFriendlyError as any).__isUserFriendly = true;
    
    // Preserve original error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      (userFriendlyError as any).originalError = error;
    }
    
    return Promise.reject(userFriendlyError);
  },
);

export default apiClient;


