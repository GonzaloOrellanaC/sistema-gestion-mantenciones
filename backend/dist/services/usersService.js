"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const Branch_1 = __importDefault(require("../models/Branch"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function createUser(orgId, payload) {
    const { firstName, lastName, email, password, roleId, permissions } = payload;
    if (!firstName || !lastName || !email || !password)
        throw { status: 400, message: 'Missing fields' };
    // if roleId provided ensure it belongs to org
    let assignedRole = roleId ? await Role_1.default.findById(roleId) : null;
    if (assignedRole && assignedRole.orgId.toString() !== orgId.toString())
        throw { status: 400, message: 'Invalid roleId' };
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const userPayload = { orgId, firstName, lastName, email, passwordHash, roleId: assignedRole?._id, isAdmin: false };
    if (payload.branchId) {
        const br = await Branch_1.default.findById(payload.branchId);
        if (!br || br.orgId.toString() !== orgId.toString())
            throw { status: 400, message: 'Invalid branchId' };
        userPayload.branchId = payload.branchId;
    }
    const user = await User_1.default.create(userPayload);
    // return populated user without passwordHash
    const populated = await User_1.default.findById(user._id).select('-passwordHash').populate('roleId').populate('branchId').lean();
    return populated;
}
async function listUsers(orgId, options) {
    const page = options?.page && options.page > 0 ? Math.floor(options.page) : 1;
    const limit = options?.limit && options.limit > 0 ? Math.min(Math.floor(options.limit), 200) : 20;
    const skip = (page - 1) * limit;
    const filter = { orgId };
    if (options?.q) {
        // simple text search on name or email
        const q = options.q.trim();
        filter.$or = [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
        ];
    }
    if (options?.branchId) {
        filter.branchId = options.branchId;
    }
    const [items, total] = await Promise.all([
        User_1.default.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).populate('roleId').populate('branchId').lean(),
        User_1.default.countDocuments(filter),
    ]);
    return { items, total, page, limit };
}
async function getUser(orgId, userId) {
    const user = await User_1.default.findOne({ _id: userId, orgId }).select('-passwordHash').populate('roleId').populate('branchId');
    if (!user)
        throw { status: 404, message: 'User not found' };
    return user;
}
async function updateUser(orgId, userId, payload) {
    const toUpdate = {};
    if (payload.firstName)
        toUpdate.firstName = payload.firstName;
    if (payload.lastName)
        toUpdate.lastName = payload.lastName;
    if (payload.email)
        toUpdate.email = payload.email;
    if (payload.roleId) {
        const role = await Role_1.default.findById(payload.roleId);
        if (!role || role.orgId.toString() !== orgId.toString())
            throw { status: 400, message: 'Invalid roleId' };
        toUpdate.roleId = payload.roleId;
    }
    if (payload.branchId) {
        const br = await Branch_1.default.findById(payload.branchId);
        if (!br || br.orgId.toString() !== orgId.toString())
            throw { status: 400, message: 'Invalid branchId' };
        toUpdate.branchId = payload.branchId;
    }
    const user = await User_1.default.findOneAndUpdate({ _id: userId, orgId }, { $set: toUpdate }, { new: true }).select('-passwordHash').populate('roleId').populate('branchId');
    if (!user)
        throw { status: 404, message: 'User not found' };
    return user;
}
async function deleteUser(orgId, userId) {
    const user = await User_1.default.findOneAndDelete({ _id: userId, orgId });
    if (!user)
        throw { status: 404, message: 'User not found' };
    return;
}
exports.default = { createUser, listUsers, getUser, updateUser, deleteUser };
