import api from './axios';
import type { WorkOrder, PaginationResponse } from './types';

/**
 * GET /api/work-orders
 * List work orders with optional query params (pagination/filters).
 * Query params example: { page, limit, status, assigneeId }
 * Returns: { items: WorkOrder[], total, page, limit }
 */
export async function listWorkOrders(params?: Record<string, unknown>): Promise<PaginationResponse<WorkOrder>> {
  const { data } = await api.get('/api/work-orders', { params });
  return data;
}

/**
 * POST /api/work-orders
 * Create a new work order from a template.
 * Payload example: { templateId, data, scheduledStart, assigneeId }
 * Returns: created WorkOrder (with orgSeq assigned)
 */
export async function createWorkOrder(payload: { templateId: string; data?: unknown; scheduledStart?: string; assigneeId?: string; assigneeRole?: string; branchId?: string }): Promise<WorkOrder> {
  const { data } = await api.post('/api/work-orders', payload);
  return data;
}

/**
 * GET /api/work-orders/:id
 * Get a single work order by id
 */
export async function getWorkOrder(id: string): Promise<WorkOrder> {
  const { data } = await api.get(`/api/work-orders/${id}`);
  return data;
}

/**
 * PUT /api/work-orders/:id/assign
 * Assign a work order to a user.
 * Path param: id (work order id)
 * Payload: { assigneeId, note }
 * Returns: updated WorkOrder
 */
export async function assignWorkOrder(id: string, assigneeId: string, note?: string): Promise<WorkOrder> {
  const { data } = await api.put(`/api/work-orders/${id}/assign`, { assigneeId, note });
  return data;
}

// Execution endpoints (start/submit/approve/reject) are intentionally omitted —
// they will be implemented in the native Android/iOS apps only.

export default { listWorkOrders, createWorkOrder, getWorkOrder, assignWorkOrder };
