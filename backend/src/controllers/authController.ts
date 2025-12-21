import { Request, Response } from 'express';
import * as authService from '../services/authService';
import User from '../models/User';
import Role from '../models/Role';
import Organization from '../models/Organization';

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

    return res.json({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, orgId: user.orgId, org: orgData, isAdmin: user.isAdmin, role: roleData });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  changePasswordAdmin
};
