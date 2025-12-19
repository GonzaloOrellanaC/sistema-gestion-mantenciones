import api from './axios';

export async function listDeviceModels(params?: Record<string, any>) {
  const { data } = await api.get('/api/device-models', { params });
  return data;
}

export async function createDeviceModel(payload: any) {
  const { data } = await api.post('/api/device-models', payload);
  return data;
}

export default { listDeviceModels, createDeviceModel };
