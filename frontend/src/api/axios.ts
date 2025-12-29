import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://gonzalo.ddns.net:5102';

const api = axios.create({
  baseURL,
});

// Attach JWT from localStorage automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

export default api;
