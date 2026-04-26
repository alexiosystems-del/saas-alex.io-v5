const normalize = (url) => (url || '').replace(/\/$/, '');

const RENDER_BACKEND_HINT = import.meta.env.VITE_RENDER_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 45000);
const FORCE_PRIMARY_BACKEND = import.meta.env.VITE_FORCE_PRIMARY_BACKEND === 'true';
const ALLOW_ORIGIN_FALLBACK = import.meta.env.VITE_ALLOW_ORIGIN_FALLBACK !== 'false';
let lastResolvedApiBase = null;

const getApiBases = () => {
  let envBase = normalize(import.meta.env.VITE_API_URL);
  
  if (envBase && envBase.includes('supabase.co')) {
    console.warn('[API] VITE_API_URL points to Supabase. Ignoring for Backend routing.');
    envBase = null;
  }
  
  // Como el dashboard ahora es fullstack continuo, el backend siempre es el mismo origin que el frontend.
  const originBase = typeof window !== 'undefined' ? window.location.origin : '';
  const primaryBase = envBase || originBase || 'https://whatsapp-fullstack-1-yjao.onrender.com';

  return [primaryBase];
};

export const getPreferredApiBase = () => getApiBases()[0] || null;
export const getLastResolvedApiBase = () => lastResolvedApiBase;

const shouldTryNextBase = (response) => {
  if (!response) return true;
  return [404, 502, 503, 504].includes(response.status);
};

export const fetchWithApiFallback = async (path, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {}, ...fetchOptions } = options;
  const bases = getApiBases();
  const errors = [];

  // Inject Authorization header globally
  const authHeaders = getAuthHeaders();
  const mergedHeaders = { 'Content-Type': 'application/json', ...headers, ...authHeaders };

  // Debug log for the 401 loop investigation
  if (path.includes('/api/saas/status')) {
    console.log(`[API Debug] Fetching ${path}. Auth Header present: ${!!authHeaders['Authorization']}`);
  }

  for (const base of bases) {
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[API] Fetching: ${url}`);
      const response = await fetch(url, { ...fetchOptions, headers: mergedHeaders, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok && shouldTryNextBase(response)) {
        errors.push(`${url} → HTTP ${response.status}`);
        continue;
      }

      lastResolvedApiBase = base;

      // Auto-logout on auth failures (stale/invalid tokens)
      if ((response.status === 401 || response.status === 403) && !path.includes('/api/auth/')) {
        // Hard guard: redirect only once per app lifecycle to avoid infinite flicker.
        if (!window.__alexLogoutRedirecting) {
          console.warn('🔒 Token rechazado por el backend (HTTP', response.status, '). Limpiando sesión...');
          window.__alexLogoutRedirecting = true;
          localStorage.removeItem('alex_io_token');
          localStorage.removeItem('alex_io_role');
          localStorage.removeItem('demo_email');
          localStorage.removeItem('alex_io_tenant');
          sessionStorage.removeItem('alex_io_token');

          // Important: do NOT force reload() here, it can trigger repeated mount/unmount
          // loops while multiple requests fail simultaneously.
          if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
            window.location.replace(`${window.location.pathname}#/login`);
          }
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      errors.push(`${url} → ${error.name === 'AbortError' ? `timeout ${timeoutMs}ms` : error.message}`);
    }
  }

  throw new Error(`No se pudo conectar al backend. Intentos: ${errors.join(' | ')}`);
};

export const fetchJsonWithApiFallback = async (path, options = {}) => {
  const response = await fetchWithApiFallback(path, options);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const bodyPreview = (await response.text()).slice(0, 80).replace(/\s+/g, ' ').trim();
    throw new Error(`El backend respondió sin JSON (HTTP ${response.status}). Preview: ${bodyPreview || 'vacío'}`);
  }

  const data = await response.json();
  return { response, data };
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
