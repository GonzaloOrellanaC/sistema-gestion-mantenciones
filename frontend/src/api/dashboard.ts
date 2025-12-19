import api from './axios';

export async function getCounts() {
  const { data } = await api.get('/api/dashboard/counts');
  return data;
}

export default { getCounts };
