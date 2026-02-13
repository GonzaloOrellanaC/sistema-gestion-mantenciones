import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role';

// Simple permission middleware. Permission names match keys inside Role.permissions
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user: any = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      // Admin bypasses permissions
      if (user.isAdmin) return next();

      const roleId = (user.roleId || '').toString();
      if (!roleId) return res.status(403).json({ message: 'Forbidden - no role assigned' });

      const role = await Role.findById(roleId).lean();
      if (!role) return res.status(403).json({ message: 'Forbidden - role not found' });

      const perms: any = role.permissions || {};
      // Normalize if permissions were passed as a single array: requirePermission(['a','b'])
      let permsToCheck: string[] = [];
      if (permissions && permissions.length === 1 && Array.isArray((permissions as any)[0])) {
        permsToCheck = (permissions as any)[0];
      } else {
        permsToCheck = permissions as string[];
      }

      // If no permissions were passed, deny by default
      if (!permsToCheck || permsToCheck.length === 0) return res.status(403).json({ message: 'Forbidden - no permission specified' });

      // Allow if user has any of the provided permissions
      for (const p of permsToCheck) {
        if (perms[p]) return next();
      }

      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    } catch (err: any) {
      console.error('permission middleware error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}

export default requirePermission;
