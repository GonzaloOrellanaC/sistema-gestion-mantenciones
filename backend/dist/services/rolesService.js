"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = createRole;
exports.listRoles = listRoles;
exports.getRole = getRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
const Role_1 = __importDefault(require("../models/Role"));
async function createRole(orgId, payload) {
    const { name, permissions, hierarchyLevel } = payload;
    if (!name)
        throw { status: 400, message: 'Missing role name' };
    const existing = await Role_1.default.findOne({ orgId, name });
    if (existing)
        throw { status: 400, message: 'Role already exists' };
    const role = await Role_1.default.create({ orgId, name, permissions: permissions || {}, hierarchyLevel: hierarchyLevel || 0 });
    return role;
}
async function listRoles(orgId, page = 1, limit = 10, q) {
    return Role_1.default.find({ orgId }).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean();
}
async function getRole(orgId, roleId) {
    const role = await Role_1.default.findOne({ _id: roleId, orgId });
    if (!role)
        throw { status: 404, message: 'Role not found' };
    return role;
}
async function updateRole(orgId, roleId, payload) {
    if (payload.name === 'Admin')
        throw { status: 400, message: 'Admin role not editable' };
    const role = await Role_1.default.findOneAndUpdate({ _id: roleId, orgId }, { $set: payload }, { new: true });
    if (!role)
        throw { status: 404, message: 'Role not found' };
    return role;
}
async function deleteRole(orgId, roleId) {
    const role = await Role_1.default.findOne({ _id: roleId, orgId });
    if (!role)
        throw { status: 404, message: 'Role not found' };
    if (role.name === 'Admin')
        throw { status: 400, message: 'Admin role cannot be deleted' };
    await role.deleteOne();
}
exports.default = { createRole, listRoles, getRole, updateRole, deleteRole };
