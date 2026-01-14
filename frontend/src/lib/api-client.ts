import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from Zustand store (stored as JSON in localStorage under 'auth-storage')
    let token: string | null = null;
    
    if (typeof window !== 'undefined') {
      try {
        // Try to get from Zustand storage first
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.accessToken || null;
        }
        
        // Fallback to direct localStorage (for backward compatibility)
        if (!token) {
          token = localStorage.getItem('accessToken');
        }
      } catch (error) {
        // If parsing fails, try direct localStorage
        token = localStorage.getItem('accessToken');
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
        // Try to refresh token - get from Zustand storage
        let refreshToken: string | null = null;
        
        if (typeof window !== 'undefined') {
          try {
            // Try to get from Zustand storage first
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
              const parsed = JSON.parse(authStorage);
              refreshToken = parsed?.state?.refreshToken || null;
            }
            
            // Fallback to direct localStorage
            if (!refreshToken) {
              refreshToken = localStorage.getItem('refreshToken');
            }
          } catch (error) {
            refreshToken = localStorage.getItem('refreshToken');
          }
        }

        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
            { refreshToken },
          );

          const { accessToken } = response.data;

          if (accessToken && typeof window !== 'undefined') {
            // Update both Zustand storage and direct localStorage
            try {
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsed = JSON.parse(authStorage);
                parsed.state.accessToken = accessToken;
                localStorage.setItem('auth-storage', JSON.stringify(parsed));
              }
            } catch (error) {
              // Fallback to direct localStorage
              localStorage.setItem('accessToken', accessToken);
            }

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        if (typeof window !== 'undefined') {
          // Clear both Zustand storage and direct localStorage
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  },
);

export default apiClient;


