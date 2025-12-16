import User from '../models/User';
import Role from '../models/Role';
import bcrypt from 'bcrypt';

export async function createUser(orgId: any, payload: any) {
  const { firstName, lastName, email, password, roleId, permissions } = payload;
  if (!firstName || !lastName || !email || !password) throw { status: 400, message: 'Missing fields' };

  // if roleId provided ensure it belongs to org
  let assignedRole = roleId ? await Role.findById(roleId) : null;
  if (assignedRole && assignedRole.orgId.toString() !== orgId.toString()) throw { status: 400, message: 'Invalid roleId' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ orgId, firstName, lastName, email, passwordHash, roleId: assignedRole?._id, isAdmin: false });

  // TODO: apply permissions override per-user if required (store separate field)
  return user;
}

export async function listUsers(orgId: any, options?: { page?: number; limit?: number; q?: string }) {
  const page = options?.page && options.page > 0 ? Math.floor(options.page) : 1;
  const limit = options?.limit && options.limit > 0 ? Math.min(Math.floor(options.limit), 200) : 20;
  const skip = (page - 1) * limit;

  const filter: any = { orgId };
  if (options?.q) {
    // simple text search on name or email
    const q = options.q.trim();
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).populate('roleId').lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getUser(orgId: any, userId: string) {
  const user = await User.findOne({ _id: userId, orgId }).select('-passwordHash').populate('roleId');
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
}

export async function updateUser(orgId: any, userId: string, payload: any) {
  const toUpdate: any = {};
  if (payload.firstName) toUpdate.firstName = payload.firstName;
  if (payload.lastName) toUpdate.lastName = payload.lastName;
  if (payload.email) toUpdate.email = payload.email;
  if (payload.roleId) {
    const role = await Role.findById(payload.roleId);
    if (!role || role.orgId.toString() !== orgId.toString()) throw { status: 400, message: 'Invalid roleId' };
    toUpdate.roleId = payload.roleId;
  }

  const user = await User.findOneAndUpdate({ _id: userId, orgId }, { $set: toUpdate }, { new: true }).select('-passwordHash');
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
}

export async function deleteUser(orgId: any, userId: string) {
  const user = await User.findOneAndDelete({ _id: userId, orgId });
  if (!user) throw { status: 404, message: 'User not found' };
  return;
}

export default { createUser, listUsers, getUser, updateUser, deleteUser };
