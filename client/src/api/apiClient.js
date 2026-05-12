import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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

// Retry logic simple para errores 5xx o red y manejo de sesión (401/403)
apiClient.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  
  // Si es un error de autenticación (401 o 403), limpiamos la sesión
  if (response && (response.status === 401 || response.status === 403)) {
    const isAuthError = response.data?.code === 'TOKEN_EXPIRED' || 
                        response.data?.code === 'INVALID_TOKEN' ||
                        response.data?.code === 'USER_NOT_FOUND' ||
                        response.data?.code === 'AUTH_REQUIRED';
    
    if (isAuthError || response.status === 401) {
      console.error('🔓 Sesión expirada o inválida. Limpiando credenciales...');
      localStorage.removeItem('alex_io_token');
      sessionStorage.removeItem('alex_io_token');
      // Despachar evento para que el frontend reaccione (e.g. App.jsx)
      window.dispatchEvent(new Event('auth_expired'));
      // Opcional: recargar si estamos en una ruta protegida y no en el login
      if (window.location.hash.includes('/dashboard')) {
          window.location.hash = '/login';
      }
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
