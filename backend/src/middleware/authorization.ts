import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role';

// Simple permission middleware. Permission names match keys inside Role.permissions
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user: any = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      // Admin bypasses permissions
      if (user.isAdmin) return next();

      const roleId = user.roleId;
      if (!roleId) return res.status(403).json({ message: 'Forbidden - no role assigned' });

      const role = await Role.findById(roleId).lean();
      if (!role) return res.status(403).json({ message: 'Forbidden - role not found' });

      const perms: any = role.permissions || {};
      if (perms[permission]) return next();

      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    } catch (err: any) {
      console.error('permission middleware error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}

export default requirePermission;
