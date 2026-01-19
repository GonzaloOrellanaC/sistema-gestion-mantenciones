"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.changePassword = changePassword;
exports.changePasswordAdmin = changePasswordAdmin;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const Organization_1 = __importDefault(require("../models/Organization"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const PasswordResetToken_1 = __importDefault(require("../models/PasswordResetToken"));
const mailer_1 = require("../utils/mailer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
async function registerUser(payload) {
    const { firstName, lastName, email, password, companyName } = payload;
    if (!firstName || !lastName || !email || !password || !companyName) {
        throw { status: 400, message: 'Missing fields' };
    }
    let org = await Organization_1.default.findOne({ name: companyName });
    if (!org) {
        const now = new Date();
        const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        org = await Organization_1.default.create({ name: companyName, trialStartsAt: now, trialEndsAt: trialEnds, isPaid: false });
    }
    let adminRole = await Role_1.default.findOne({ orgId: org._id, name: 'Admin' });
    if (!adminRole) {
        adminRole = await Role_1.default.create({ orgId: org._id, name: 'Admin', permissions: {}, hierarchyLevel: 0 });
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await User_1.default.create({ orgId: org._id, firstName, lastName, email, passwordHash, roleId: adminRole._id, isAdmin: true });
    const token = jsonwebtoken_1.default.sign({ userId: user._id, orgId: org._id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user._id, email: user.email, firstName, lastName }, org: { id: org._id, name: org.name, trialStartsAt: org.trialStartsAt, trialEndsAt: org.trialEndsAt, isPaid: org.isPaid } };
}
async function loginUser(payload) {
    console.log('Login payload:', payload);
    const { email, password } = payload;
    if (!email || !password)
        throw { status: 400, message: 'Missing fields' };
    // Find the user by email across organizations
    const user = await User_1.default.findOne({ email });
    if (!user)
        throw { status: 401, message: 'Invalid credentials' };
    // Resolve organization from user's orgId
    const org = await Organization_1.default.findById(user.orgId);
    if (!org)
        throw { status: 400, message: 'Organization not found' };
    const match = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!match)
        throw { status: 401, message: 'Invalid credentials' };
    // If organization is not paid and trial has ended, prevent login
    if (!org.isPaid) {
        const trialEnds = org.trialEndsAt;
        if (trialEnds && trialEnds.getTime() < Date.now()) {
            throw { status: 402, message: 'Trial expired. Please complete payment to continue.' };
        }
    }
    const token = jsonwebtoken_1.default.sign({ userId: user._id, orgId: org._id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }, org: { id: org._id, name: org.name, trialStartsAt: org.trialStartsAt, trialEndsAt: org.trialEndsAt, isPaid: org.isPaid } };
}
async function forgotPassword(payload) {
    const { email, companyName } = payload;
    if (!email || !companyName)
        throw { status: 400, message: 'Missing fields' };
    const org = await Organization_1.default.findOne({ name: companyName });
    if (!org)
        throw { status: 400, message: 'Organization not found' };
    const user = await User_1.default.findOne({ email, orgId: org._id });
    if (!user)
        return; // do not leak existence
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await PasswordResetToken_1.default.create({ userId: user._id, token, expiresAt });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5100';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    await (0, mailer_1.sendPasswordResetEmail)(user.email, resetLink);
}
async function resetPassword(payload) {
    const { token, newPassword } = payload;
    if (!token || !newPassword)
        throw { status: 400, message: 'Missing fields' };
    const tokenDoc = await PasswordResetToken_1.default.findOne({ token });
    if (!tokenDoc)
        throw { status: 400, message: 'Invalid or expired token' };
    if (tokenDoc.used)
        throw { status: 400, message: 'Token already used' };
    if (tokenDoc.expiresAt < new Date())
        throw { status: 400, message: 'Token expired' };
    const user = await User_1.default.findById(tokenDoc.userId);
    if (!user)
        throw { status: 400, message: 'User not found' };
    user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await user.save();
    tokenDoc.used = true;
    await tokenDoc.save();
}
async function changePassword(userId, payload) {
    const { currentPassword, newPassword } = payload;
    if (!currentPassword || !newPassword)
        throw { status: 400, message: 'Missing fields' };
    if (typeof newPassword !== 'string' || newPassword.length < 8)
        throw { status: 400, message: 'New password must be at least 8 characters' };
    const user = await User_1.default.findById(userId);
    if (!user)
        throw { status: 404, message: 'User not found' };
    const match = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
    if (!match)
        throw { status: 401, message: 'Current password incorrect' };
    user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await user.save();
}
async function changePasswordAdmin(requesterId, payload) {
    const { userId, newPassword } = payload;
    if (!userId || !newPassword)
        throw { status: 400, message: 'Missing fields' };
    if (typeof newPassword !== 'string' || newPassword.length < 8)
        throw { status: 400, message: 'New password must be at least 8 characters' };
    const requester = await User_1.default.findById(requesterId);
    if (!requester)
        throw { status: 401, message: 'Unauthorized' };
    if (!requester.isAdmin)
        throw { status: 403, message: 'Forbidden: admin only' };
    const target = await User_1.default.findById(userId);
    if (!target)
        throw { status: 404, message: 'Target user not found' };
    target.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await target.save();
}
exports.default = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    changePassword,
    changePasswordAdmin
};
