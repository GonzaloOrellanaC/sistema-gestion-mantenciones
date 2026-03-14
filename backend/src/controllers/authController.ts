import { Request, Response } from 'express';
import * as authService from '../services/authService';
import User from '../models/User';
import Role from '../models/Role';
import Organization from '../models/Organization';
import EmailConfirmationToken from '../models/EmailConfirmationToken';
import dotenv from 'dotenv';
dotenv.config();

export async function register(req: Request, res: Response) {
  try {
    const result = await authService.registerUser(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await authService.loginUser(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    await authService.forgotPassword(req.body);
    return res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    await authService.resetPassword(req.body);
    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    await authService.changePassword(userId, req.body);
    return res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function changePasswordAdmin(req: Request, res: Response) {
  try {
    const requesterId = (req as any).user.id;
    await authService.changePasswordAdmin(requesterId, req.body);
    return res.json({ message: 'Password updated for user' });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // include role info if available
    let roleData = null;
    try {
      if ((user as any).roleId) {
        const role = await Role.findById((user as any).roleId).lean();
        if (role) roleData = { id: role._id, name: role.name, permissions: role.permissions || {} };
      }
    } catch (e) {
      // ignore role lookup errors
    }

    // include organization info
    let orgData = null;
    try {
      if (user.orgId) {
        const org = await Organization.findById(user.orgId).lean();
        if (org) orgData = { id: org._id, name: org.name, trialStartsAt: (org as any).trialStartsAt, trialEndsAt: (org as any).trialEndsAt, isPaid: (org as any).isPaid };
      }
    } catch (e) {
      // ignore org lookup errors
    }

    return res.json({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, orgId: user.orgId, org: orgData, isAdmin: user.isAdmin, role: roleData, photoUrl: (user as any).photoUrl || null, enteredToRoleCreation: user.enteredToRoleCreation });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function confirmEmail(req: Request, res: Response) {
  try {
    const { token } = req.query as any;
    if (!token) return res.status(400).send('Missing token');

    const tokenDoc = await EmailConfirmationToken.findOne({ token });
    if (!tokenDoc) return res.status(400).send('Invalid or expired token');
    if (tokenDoc.used) return res.status(400).send('Token already used');
    if (tokenDoc.expiresAt < new Date()) return res.status(400).send('Token expired');

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(404).send('User not found');

    user.set('confirmed', true);
    await user.save();

    tokenDoc.used = true;
    await tokenDoc.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5100';
    // small confirmation page that redirects to login after 5s
    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Correo confirmado</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#F8FAFC;color:#334155;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .card{background:#fff;padding:24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);text-align:center}</style></head><body><div class="card"><h2>Correo confirmado</h2><p>Gracias — serás redirigido al inicio de sesión en 5 segundos.</p><p><a href="${frontend}/login">Ir ahora</a></p></div><script>setTimeout(()=>{window.location.href='${frontend}/login'},5000);</script></body></html>`;

    return res.send(html);
  } catch (err: any) {
    console.error(err);
    return res.status(500).send('Server error');
  }
}

export default {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  changePasswordAdmin
  ,confirmEmail,
  me
};
