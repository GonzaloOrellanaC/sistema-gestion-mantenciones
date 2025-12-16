import Role from '../models/Role';

export async function createRole(orgId: any, payload: any) {
  const { name, permissions, hierarchyLevel } = payload;
  if (!name) throw { status: 400, message: 'Missing role name' };
  const existing = await Role.findOne({ orgId, name });
  if (existing) throw { status: 400, message: 'Role already exists' };
  const role = await Role.create({ orgId, name, permissions: permissions || {}, hierarchyLevel: hierarchyLevel || 0 });
  return role;
}

export async function listRoles(orgId: any, page = 1, limit = 10, q?: string) {
  return Role.find({ orgId }).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean();
}

export async function getRole(orgId: any, roleId: string) {
  const role = await Role.findOne({ _id: roleId, orgId });
  if (!role) throw { status: 404, message: 'Role not found' };
  return role;
}

export async function updateRole(orgId: any, roleId: string, payload: any) {
  if (payload.name === 'Admin') throw { status: 400, message: 'Admin role not editable' };
  const role = await Role.findOneAndUpdate({ _id: roleId, orgId }, { $set: payload }, { new: true });
  if (!role) throw { status: 404, message: 'Role not found' };
  return role;
}

export async function deleteRole(orgId: any, roleId: string) {
  const role = await Role.findOne({ _id: roleId, orgId });
  if (!role) throw { status: 404, message: 'Role not found' };
  if (role.name === 'Admin') throw { status: 400, message: 'Admin role cannot be deleted' };
  await role.deleteOne();
}

export default { createRole, listRoles, getRole, updateRole, deleteRole };
