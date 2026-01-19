import api from './axios';

export async function add(payload: Record<string, any>) {
  const { data } = await api.post('/api/costs', payload);
  return data;
}

export async function listByWorkOrder(workOrderId: string, params?: Record<string, any>) {
  const { data } = await api.get(`/api/costs/work-order/${workOrderId}`, { params });
  return data;
}

export async function aggregate(workOrderId: string, params?: Record<string, any>) {
  const { data } = await api.get(`/api/costs/work-order/${workOrderId}/aggregate`, { params });
  return data;
}

export default { add, listByWorkOrder, aggregate };
