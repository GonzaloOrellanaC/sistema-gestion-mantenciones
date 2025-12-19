import api from './axios';

export async function listBrands(params?: Record<string, any>) {
  const { data } = await api.get('/api/brands', { params });
  return data;
}

export async function createBrand(payload: any) {
  const { data } = await api.post('/api/brands', payload);
  return data;
}

export default { listBrands, createBrand };
