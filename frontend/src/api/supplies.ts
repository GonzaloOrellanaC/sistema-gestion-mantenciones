import api from './axios';

export async function getSupplies(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/supplies', { params });
  return data;
}

export async function getSupplyById(id: string) {
  const { data } = await api.get(`/api/supplies/${id}`);
  return data;
}

export async function createSupply(formData: FormData) {
  const { data } = await api.post('/api/supplies', formData);
  return data;
}

export default { getSupplies, createSupply, getSupplyById };
