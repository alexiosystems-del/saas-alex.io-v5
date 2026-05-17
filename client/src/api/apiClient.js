import axios from 'axios';
import { getPreferredApiBase } from '../api';

const apiClient = axios.create({
  baseURL: getPreferredApiBase() || import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

// Interceptor para inyectar Token de ALEX IO
apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry logic simple para errores 5xx o red
apiClient.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  
  const isAuthExpired = response?.status === 403 && (
    response?.data?.code === 'TOKEN_EXPIRED' ||
    response?.data?.reason === 'Token expired' ||
    String(response?.data?.details || '').toLowerCase().includes('expired')
  );

  if (isAuthExpired && typeof window !== 'undefined') {
    localStorage.removeItem('alex_io_token');
    sessionStorage.removeItem('alex_io_token');
    if (!window.location.pathname.includes('/login')) {
      alert('Tu sesión expiró. Iniciá sesión nuevamente.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

  if (!config || !config.retry) return Promise.reject(error);
  
  if (response && response.status < 500) return Promise.reject(error);

  config.retryCount = config.retryCount || 0;
  if (config.retryCount >= config.retry) return Promise.reject(error);

  config.retryCount += 1;
  const delay = Math.pow(2, config.retryCount) * 1000;
  
  await new Promise(r => setTimeout(r, delay));
  return apiClient(config);
});

export default apiClient;
