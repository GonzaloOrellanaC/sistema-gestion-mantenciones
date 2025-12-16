import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function authMiddleware(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const payload: any = jwt.verify(token, JWT_SECRET);

    // Attach basic user info from token
    const userId = payload.userId;
    const orgId = payload.orgId;

    // fetch user to attach roleId and isAdmin for authorization checks
    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ message: 'Invalid token: user not found' });

    (req as any).user = {
      id: userId,
      orgId,
      roleId: (user as any).roleId,
      isAdmin: (user as any).isAdmin || false,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default authMiddleware;
