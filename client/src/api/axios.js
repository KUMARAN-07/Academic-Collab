import axios from 'axios';
import useAuthStore from '../stores/authStore';

// Create a separate instance for token refresh to avoid circular dependency
const refreshInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add token refresh interceptor to the refresh instance
refreshInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Export for use in authStore
export const getRefreshInstance = () => refreshInstance;

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized error
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token using the refresh instance
        const response = await refreshInstance.post('/auth/refresh-token');
        const { token } = response.data;
        
        if (!token) {
          throw new Error('Invalid token received');
        }

        // Update token in store and localStorage
        useAuthStore.getState().setToken(token);
        localStorage.setItem('token', token);
        
        // Update the Authorization header for all future requests
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request with new token
        return instance(originalRequest);
      } catch (refreshError) {
        // Clear auth state and redirect to login
        useAuthStore.getState().logout();
        localStorage.removeItem('token');
        delete instance.defaults.headers.common['Authorization'];
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject({ 
          message: 'Session expired. Please login again.',
          status: 401
        });
      }
    }

    // Handle server errors with retry mechanism
    if (error.response?.status >= 500) {
      const retryCount = originalRequest._retryCount || 0;
      const maxRetries = 3;
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);

      if (retryCount < maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return instance(originalRequest);
      }
    }

    // Handle all other errors
    const errorMessage = error.response?.data?.message || error.response?.data || error.message || 'An error occurred';
    return Promise.reject({ 
      message: errorMessage,
      status: error.response?.status,
      code: error.response?.data?.code
    });
  }
);

export default instance;