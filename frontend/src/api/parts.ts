import api from './axios';

export async function listParts(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/parts', { params });
  return data; // { items: [...] }
}

/**
 * POST /api/parts/availability
 * Body: { partIds: string[] }
 * Returns: { items: [{ partId: string, available: number, part?: object }] }
 */
export async function getPartsAvailability(partIds: string[]) {
  const { data } = await api.post('/api/parts/availability', { partIds });
  return data;
}

export default { listParts };
