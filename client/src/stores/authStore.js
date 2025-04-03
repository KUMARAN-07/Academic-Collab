import create from 'zustand';
import axios, { getRefreshInstance } from '../api/axios';

const refreshToken = async () => {
  try {
    const response = await getRefreshInstance().post('/auth/refresh-token');
    const { token } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    throw error;
  }
};

const useAuthStore = create((set) => ({
  setToken: (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
  },
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, data: { user } } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'An error occurred during login',
        isLoading: false
      });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      const { token, data: { user } } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'An error occurred during registration',
        isLoading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'An error occurred',
        isLoading: false
      });
      return false;
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      await axios.patch(`/auth/reset-password/${token}`, { password });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'An error occurred',
        isLoading: false
      });
      return false;
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await axios.get(`/auth/verify-email/${token}`);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'An error occurred',
        isLoading: false
      });
      return false;
    }
  }
}));

export default useAuthStore;