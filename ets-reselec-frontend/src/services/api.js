import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
const tokenStorage = {
  get: () => localStorage.getItem('auth_token'),
  set: (token) => localStorage.setItem('auth_token', token),
  remove: () => localStorage.removeItem('auth_token'),
  
  getRefresh: () => localStorage.getItem('refresh_token'),
  setRefresh: (token) => localStorage.setItem('refresh_token', token),
  removeRefresh: () => localStorage.removeItem('refresh_token'),
  
  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = tokenStorage.getRefresh();
      
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
            { token: refreshToken }
          );
          
          const newToken = response.data.data.token;
          tokenStorage.set(newToken);
          
          processQueue(null, newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          processQueue(refreshError, null);
          handleLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        handleLogout();
        return Promise.reject(error);
      }
    }
    
    // Handle other HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          if (data.details && Array.isArray(data.details)) {
            // Validation errors
            data.details.forEach(detail => {
              toast.error(detail.msg || detail.message || 'Validation error');
            });
          } else {
            toast.error(data.message || 'Bad request');
          }
          break;
          
        case 403:
          toast.error('Access denied. You don\'t have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Resource not found');
          break;
          
        case 422:
          toast.error(data.message || 'Validation failed');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Logout function to be called when token refresh fails
const handleLogout = () => {
  tokenStorage.clear();
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
  
  toast.error('Session expired. Please log in again.');
};

// Helper functions for common API patterns
export const apiHelpers = {
  // Get with loading state
  get: async (url, config = {}) => {
    return api.get(url, config);
  },
  
  // Post with success message
  post: async (url, data, config = {}) => {
    const response = await api.post(url, data, config);
    if (response.data.message && response.data.success) {
      toast.success(response.data.message);
    }
    return response;
  },
  
  // Put with success message
  put: async (url, data, config = {}) => {
    const response = await api.put(url, data, config);
    if (response.data.message && response.data.success) {
      toast.success(response.data.message);
    }
    return response;
  },
  
  // Delete with confirmation
  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    if (response.data.message && response.data.success) {
      toast.success(response.data.message);
    }
    return response;
  },
  
  // Silent request (no automatic error handling)
  silent: {
    get: (url, config = {}) => api.get(url, { ...config, skipErrorHandling: true }),
    post: (url, data, config = {}) => api.post(url, data, { ...config, skipErrorHandling: true }),
    put: (url, data, config = {}) => api.put(url, data, { ...config, skipErrorHandling: true }),
    delete: (url, config = {}) => api.delete(url, { ...config, skipErrorHandling: true })
  }
};

export { tokenStorage };
export default api;