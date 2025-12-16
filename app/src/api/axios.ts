import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

console.log('Capacitor platform:', Capacitor.getPlatform());

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

let authToken: string | null = null;

function buildUrl(path: string) {
  if (!path) return baseURL;
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseURL) return path;
  return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

// Axios fallback instance for web or if Capacitor Http isn't available
const axiosInstance = axios.create({ baseURL, withCredentials: true });

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete axiosInstance.defaults.headers.common['Authorization'];
}

async function capacitorRequest(method: string, url: string, data?: any, config?: any) {
  const isHttpPluginAvailable = Capacitor.isPluginAvailable('CapacitorHttp');
  console.log('CapacitorHttp available:', isHttpPluginAvailable);
  if (isHttpPluginAvailable) {
    const fullUrl = buildUrl(url);
    const headers = Object.assign({}, (config && config.headers) || {});
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const options: any = {
      method: method.toUpperCase(),
      url: fullUrl,
      headers,
    };
    if (data !== undefined) options.data = data;
    if (config && config.params) options.params = config.params;

    const res = await CapacitorHttp.request(options as any);
    return { data: res.data, status: (res as any).status, headers: (res as any).headers };
  } else {
    return axiosFallback(method, url, data, config);
  }
}

function axiosFallback(method: string, url: string, data?: any, config?: any) {
  const fullUrl = buildUrl(url);
  return axiosInstance.request({ method, url: fullUrl, data, ...(config || {}) });
}

const api = {
  get: (url: string, config?: any) => {
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest('GET', url, undefined, config);
    return axiosFallback('GET', url, undefined, config);
  },
  post: (url: string, data?: any, config?: any) => {
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest('POST', url, data, config);
    return axiosFallback('POST', url, data, config);
  },
  put: (url: string, data?: any, config?: any) => {
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest('PUT', url, data, config);
    return axiosFallback('PUT', url, data, config);
  },
  patch: (url: string, data?: any, config?: any) => {
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest('PATCH', url, data, config);
    return axiosFallback('PATCH', url, data, config);
  },
  delete: (url: string, config?: any) => {
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest('DELETE', url, undefined, config);
    return axiosFallback('DELETE', url, undefined, config);
  },
  request: (opts: any) => {
    const method = (opts.method || 'GET').toUpperCase();
    const url = opts.url || opts.path || '';
    const data = opts.data || opts.body || undefined;
    const config = { headers: opts.headers || {}, params: opts.params || undefined };
    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') return capacitorRequest(method, url, data, config);
    return axiosFallback(method, url, data, config);
  }
};

export default api;