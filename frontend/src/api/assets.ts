import api from './axios';

export async function listAssets(params?: Record<string, any>) {
  const { data } = await api.get('/api/assets', { params });
  return data;
}

export async function createAsset(payload: any) {
  // if payload is FormData, send multipart
  if (payload instanceof FormData) {
    const { data } = await api.post('/api/assets', payload);
    return data;
  }
  const { data } = await api.post('/api/assets', payload);
  return data;
}

export async function getAsset(id: string) {
  const { data } = await api.get(`/api/assets/${id}`);
  return data;
}

export async function updateAsset(id: string, payload: any) {
  const { data } = await api.put(`/api/assets/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string) {
  const { data } = await api.delete(`/api/assets/${id}`);
  return data;
}

export async function bulkCreate(payload: any[]) {
  const { data } = await api.post('/api/assets/bulk', payload);
  return data;
}

export default { listAssets, createAsset, getAsset, updateAsset, deleteAsset, bulkCreate };
