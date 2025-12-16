import api from './axios';
import type { Role, PaginationResponse } from './types';

/**
 * GET /api/roles
 * List roles with optional query params.
 * Returns: { items: Role[], total }
 */
export async function listRoles(params?: Record<string, unknown>): Promise<PaginationResponse<Role>> {
  const { data } = await api.get('/api/roles', { params });
  return data;
}

/**
 * GET /api/roles/:id
 * Get role by id.
 * Path param: id
 * Returns: Role
 */
export async function getRole(id: string): Promise<Role> {
  const { data } = await api.get(`/api/roles/${id}`);
  return data;
}

/**
 * POST /api/roles
 * Create a new role with permissions.
 * Payload: { name, permissions: string[] }
 * Returns: created Role
 */
export async function createRole(payload: Partial<Role>): Promise<Role> {
  const { data } = await api.post('/api/roles', payload);
  return data;
}

/**
 * PUT /api/roles/:id
 * Update role's metadata/permissions.
 * Path param: id
 * Payload: fields to update
 * Returns: updated Role
 */
export async function updateRole(id: string, payload: Partial<Role>): Promise<Role> {
  const { data } = await api.put(`/api/roles/${id}`, payload);
  return data;
}

/**
 * DELETE /api/roles/:id
 * Delete a role by id.
 * Path param: id
 * Returns: deletion result
 */
export async function deleteRole(id: string): Promise<unknown> {
  const { data } = await api.delete(`/api/roles/${id}`);
  return data;
}

export default { listRoles, getRole, createRole, updateRole, deleteRole };
