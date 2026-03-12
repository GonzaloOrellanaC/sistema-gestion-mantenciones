import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Organization from '../models/Organization';
import User from '../models/User';
import Role from '../models/Role';
import PasswordResetToken from '../models/PasswordResetToken';
import EmailConfirmationToken from '../models/EmailConfirmationToken';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/mailer';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function registerUser(payload: any) {
  const { firstName, lastName, email, password, companyName } = payload;
  if (!firstName || !lastName || !email || !password || !companyName) {
    throw { status: 400, message: 'Missing fields' };
  }

  let org = await Organization.findOne({ name: companyName });
  if (!org) {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    org = await Organization.create({ name: companyName, trialStartsAt: now, trialEndsAt: trialEnds, isPaid: false });
  }

  let adminRole = await Role.findOne({ orgId: org._id, name: 'Administrador' });
  if (!adminRole) {
    adminRole = await Role.create({
      orgId: org._id,
      name: 'Administrador',
      permissions: {
        verTablero: true,
        verUsuarios: true,
        crearUsuarios: true,
        editarUsuarios: true,

        verPautas: true,
        crearPautas: true,
        editarPautas: true,

        verOT: true,
        crearOT: true,
        editarOT: true,
        asignarOT: true,
        ejecutarOT: true,
        supervisar: true,
        aprobarRechazar: true,

        verRoles: true,
        crearRoles: true,
        editarRoles: true,

        verOrganizacion: true,
        editarOrganizacion: true,
        verOrganization: true,
        editarOrganization: true,

        verActivos: true,
        crearActivos: true,
        editarActivos: true,

        verSucursales: true,
        crearSucursales: true,
        editarSucursales: true,

        verInsumos: true,
        crearInsumos: true,
        editarInsumos: true,

        verRepuestos: true,
        crearRepuestos: true,
        editarRepuestos: true,

        verLotes: true,
        crearLotes: true,
        editarLotes: true
      },
      hierarchyLevel: 0
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ orgId: org._id, firstName, lastName, email, passwordHash, roleId: adminRole._id, isAdmin: true, confirmed: false });

  const token = jwt.sign({ userId: user._id, orgId: org._id }, JWT_SECRET, { expiresIn: '7d' });

  // create a confirmation token record (random token) for email verification
  const confirmToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await EmailConfirmationToken.create({ userId: user._id, token: confirmToken, expiresAt });

  // construct confirmation link using FRONTEND_URL and token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5100';
  const confirmLink = `${frontendUrl}/auth/confirm-email/${confirmToken}`;

  // enviar correo de bienvenida y lanzar error si falla
  async function getPublicIp() {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (!res.ok) throw new Error('No se pudo obtener la IP pública');
      const data = await res.json();
      return data.ip;
    } catch (err) {
      return '';
    }
  }

  let mailSent = false;
  let mailError = null;
  try {
    await sendWelcomeEmail(user.email, confirmLink, `${firstName} ${lastName}`);
    mailSent = true;
  } catch (e: any) {
    mailError = e;
    // Intentar whitelistear la IP y reenviar
    const ip = await getPublicIp();
    if (ip) {
      try {
        const desc = `sgm-auto-whitelist-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        const resp = await fetch('https://add-ip-whitelist-mailgun.omtecnologia.cl/add-ip-to-whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip, mailgunApiKey: process.env.MAILGUN_API_KEY, description: desc })
        });
        if (resp.ok) {
          try {
            await sendWelcomeEmail(user.email, confirmLink, `${firstName} ${lastName}`);
            mailSent = true;
          } catch (e2: any) {
            mailError = e2;
          }
        }
      } catch (werr) {
        // No hacer nada, se mantiene mailError
      }
    }
  }
  if (!mailSent) {
    console.log('Failed to send welcome email after retry attempts:', mailError);
    throw { status: 500, message: mailError?.message || 'No se pudo enviar el correo de bienvenida.' };
  }

  return { token, user: { id: user._id, email: user.email, firstName, lastName }, org: { id: org._id, name: org.name, trialStartsAt: (org as any).trialStartsAt, trialEndsAt: (org as any).trialEndsAt, isPaid: (org as any).isPaid } };
}

export async function loginUser(payload: any) {
  console.log('Login payload:', payload);
  const { email, password } = payload;
  if (!email || !password) throw { status: 400, message: 'Missing fields' };

  // Find the user by email across organizations
  const user = await User.findOne({ email });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  // Block login if the user has not confirmed their email
  if (!(user as any).confirmed) {
    throw { status: 403, message: 'Email not confirmed' };
  }

  // Resolve organization from user's orgId
  const org = await Organization.findById(user.orgId);
  if (!org) throw { status: 400, message: 'Organization not found' };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw { status: 401, message: 'Invalid credentials' };

  // If organization is not paid and trial has ended, prevent login
  if (!(org as any).isPaid) {
    const trialEnds: Date | undefined = (org as any).trialEndsAt;
    if (trialEnds && trialEnds.getTime() < Date.now()) {
      throw { status: 402, message: 'Trial expired. Please complete payment to continue.' };
    }
  }

  const token = jwt.sign({ userId: user._id, orgId: org._id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }, org: { id: org._id, name: org.name, trialStartsAt: (org as any).trialStartsAt, trialEndsAt: (org as any).trialEndsAt, isPaid: (org as any).isPaid } } as any;
}

export async function forgotPassword(payload: any) {
  const { email, companyName } = payload;
  if (!email || !companyName) throw { status: 400, message: 'Missing fields' };

  const org = await Organization.findOne({ name: companyName });
  if (!org) throw { status: 400, message: 'Organization not found' };

  const user = await User.findOne({ email, orgId: org._id });
  if (!user) return; // do not leak existence

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await PasswordResetToken.create({ userId: user._id, token, expiresAt });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5100';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetLink);
}

export async function resetPassword(payload: any) {
  const { token, newPassword } = payload;
  if (!token || !newPassword) throw { status: 400, message: 'Missing fields' };

  const tokenDoc = await PasswordResetToken.findOne({ token });
  if (!tokenDoc) throw { status: 400, message: 'Invalid or expired token' };
  if (tokenDoc.used) throw { status: 400, message: 'Token already used' };
  if (tokenDoc.expiresAt < new Date()) throw { status: 400, message: 'Token expired' };

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw { status: 400, message: 'User not found' };

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  tokenDoc.used = true;
  await tokenDoc.save();
}

export async function changePassword(userId: string, payload: any) {
  const { currentPassword, newPassword } = payload;
  if (!currentPassword || !newPassword) throw { status: 400, message: 'Missing fields' };
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw { status: 400, message: 'New password must be at least 8 characters' };

  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw { status: 401, message: 'Current password incorrect' };

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
}

export async function changePasswordAdmin(requesterId: string, payload: any) {
  const { userId, newPassword } = payload;
  if (!userId || !newPassword) throw { status: 400, message: 'Missing fields' };
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw { status: 400, message: 'New password must be at least 8 characters' };

  const requester = await User.findById(requesterId);
  if (!requester) throw { status: 401, message: 'Unauthorized' };
  if (!requester.isAdmin) throw { status: 403, message: 'Forbidden: admin only' };

  const target = await User.findById(userId);
  if (!target) throw { status: 404, message: 'Target user not found' };

  target.passwordHash = await bcrypt.hash(newPassword, 10);
  await target.save();
}

export default {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  changePasswordAdmin
};
