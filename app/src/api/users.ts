import api from './axios';

export type UserDTO = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  orgId?: string;
  deleted?: boolean;
};

export async function getUsers(params: { page?: number; limit?: number; orgId?: string } = {}) {
  const { page = 1, limit = 10, orgId } = params;
  const path = orgId ? `/orgs/${orgId}/users` : '/users';
  const res = await api.get(path, { params: { page, limit } });
  return res.data;
}

export async function createUser(payload: Partial<UserDTO> & { password?: string; roleId?: string; orgId?: string }) {
  const { orgId, ...rest } = payload as any;
  const path = orgId ? `/orgs/${orgId}/users` : '/users';
  const res = await api.post(path, rest);
  return res.data;
}

export async function updateUser(userId: string, payload: Partial<UserDTO>) {
  const res = await api.put(`/users/${userId}`, payload);
  return res.data;
}

export async function deleteUser(userId: string) {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
}

export default { getUsers, createUser, updateUser, deleteUser };
