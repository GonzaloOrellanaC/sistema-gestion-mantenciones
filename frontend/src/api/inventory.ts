import api from './axios';

export async function listWarehouses(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/inventory/warehouses', { params });
  return data;
}

export async function createWarehouse(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/inventory/warehouses', payload);
  return data;
}

export async function listStock(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/inventory/stock', { params });
  return data;
}

export async function reservePart(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/inventory/reserve', payload);
  return data;
}

export async function consumePart(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/inventory/consume', payload);
  return data;
}

export async function adjustStock(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/inventory/adjust', payload);
  return data;
}

export async function transferStock(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/inventory/transfer', payload);
  return data;
}

export async function listMovements(params?: Record<string, unknown>) {
  const { data } = await api.get('/api/inventory/movements', { params });
  return data;
}

export default { listWarehouses, createWarehouse, listStock, reservePart, consumePart, adjustStock, transferStock, listMovements };
