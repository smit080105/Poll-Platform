import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pollwave_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem('pollwave_token'));
      localStorage.removeItem('pollwave_token');
      localStorage.removeItem('pollwave_user');
      if (hadToken && !['/login', '/register', '/'].includes(window.location.pathname)) {
        const returnTo = window.location.pathname.startsWith('/poll/')
          ? `?returnTo=${encodeURIComponent(window.location.pathname)}`
          : '';
        window.location.href = `/login${returnTo}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
