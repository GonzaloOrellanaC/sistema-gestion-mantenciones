import api from './axios';
import type { User, PaginationResponse } from './types';

/**
 * GET /api/users
 * List users with optional query params (page, limit, q).
 * Returns: { items: User[], total, page, limit }
 */
export async function listUsers(params?: Record<string, unknown>): Promise<PaginationResponse<User>> {
  const { data } = await api.get('/api/users', { params });
  return data;
}

/**
 * GET /api/users/:id
 * Get user by id.
 * Path param: id
 * Returns: User
 */
export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/api/users/${id}`);
  return data;
}

/**
 * POST /api/users
 * Create a new user within the organization.
 * Payload: { firstName, lastName, email, roles[], ... }
 * Returns: created User
 */
export async function createUser(payload: Partial<User>): Promise<User> {
  const { data } = await api.post('/api/users', payload);
  return data;
}

/**
 * PUT /api/users/:id
 * Update a user's data.
 * Path param: id
 * Payload: fields to update
 * Returns: updated User
 */
export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const { data } = await api.put(`/api/users/${id}`, payload);
  return data;
}

/**
 * DELETE /api/users/:id
 * Delete (or soft-delete) a user by id.
 * Path param: id
 * Returns: deletion result or updated user
 */
export async function deleteUser(id: string): Promise<unknown> {
  const { data } = await api.delete(`/api/users/${id}`);
  return data;
}

export default { listUsers, getUser, createUser, updateUser, deleteUser };
