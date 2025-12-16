import api from './axios';
import type { FileMeta, WorkOrder } from './types';

/**
 * POST /api/files/upload
 * Upload a generic file and create a FileMeta record.
 * Form-data fields: file (File), type (string, e.g. 'work_order_photos')
 * Returns: FileMeta object with file path and metadata (including thumbnail if image).
 */
export async function uploadFile(file: File, type = 'work_order_photos'): Promise<FileMeta> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);

  const { data } = await api.post('/api/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * POST /api/work-orders/:id/attachments
 * Attach an uploaded file directly to a work order.
 * Path param: id (work order id)
 * Form-data: file (File), type (string)
 * Returns: FileMeta and updated WorkOrder/attachment reference depending on backend response
 */
export async function attachFileToWorkOrder(workOrderId: string, file: File, type = 'work_order_photos'):
  Promise<{ file: FileMeta; workOrder?: WorkOrder } | FileMeta | unknown> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);

  const { data } = await api.post(`/api/work-orders/${workOrderId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export default { uploadFile, attachFileToWorkOrder };
