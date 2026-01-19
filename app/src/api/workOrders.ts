import api from './axios';

export type WorkOrder = {
  _id: string;
  orgSeq?: number;
  templateId?: string;
  title?: string;
  state?: string;
  assigneeId?: string;
  createdAt?: string;
};

export async function getWorkOrders(params: { page?: number; limit?: number; filters?: any } = {}) {
  const { page = 1, limit = 10, filters } = params;
  const path = '/work-orders';
  const res = await api.get(path, { params: { page, limit, ...filters } });
  return res.data;
}

export async function getWorkOrder(id: string) {
  const path = `/work-orders/${id}`;
  const res = await api.get(path);
  return res.data;
}

export async function updateWorkOrder(id: string, data: any) {
  const path = `/work-orders/${id}`;
  const res = await api.put(path, data);
  return res.data;
}

export async function startWorkOrder(id: string) {
  const path = `/work-orders/${id}/start`;
  const res = await api.put(path);
  return res.data;
}

export async function uploadWorkOrderAttachment(id: string, file: File, type?: string) {
  const path = `/work-orders/${id}/attachments`;
  const fd = new FormData();
  fd.append('file', file, (file && file.name) || 'file');
  if (type) fd.append('type', type);
  const res = await api.post(path, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export default { getWorkOrders };
