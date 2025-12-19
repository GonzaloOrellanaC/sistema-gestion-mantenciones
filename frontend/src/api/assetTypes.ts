import api from './axios';

export async function listAssetTypes(params?: Record<string, any>) {
  const { data } = await api.get('/api/asset-types', { params });
  return data;
}

export async function createAssetType(payload: any) {
  const { data } = await api.post('/api/asset-types', payload);
  return data;
}

export default { listAssetTypes, createAssetType };
