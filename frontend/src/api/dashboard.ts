import api from './axios';

export async function getCounts(params?: Record<string, any>) {
  const { data } = await api.get('/api/dashboard/counts', { params });
  return data;
}

export default { getCounts };
