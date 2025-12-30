import api from './axios';

// Compatibility wrapper: call the new /api/parts endpoints
export async function listRepuestos(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/parts', { params });
  return data; // { items: [...] }
}

export default { listRepuestos };
