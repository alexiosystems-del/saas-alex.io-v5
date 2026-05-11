import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

// Interceptor para inyectar Token de Supabase
apiClient.interceptors.request.use(async (config) => {
  const sessionStr = localStorage.getItem('supabase.auth.token');
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    config.headers.Authorization = `Bearer ${session.currentSession?.access_token}`;
  }
  return config;
});

// Retry logic simple para errores 5xx o red
apiClient.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
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
