import api from './axios';

export async function listParts(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/parts', { params });
  return data; // { items: [...] }
}

export default { listParts };
