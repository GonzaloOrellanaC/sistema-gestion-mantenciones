import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import authMiddleware from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many password reset requests, try later.' });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotLimiter, async (req, res, next) => {
  // basic validation before controller: email format
  const { email } = req.body;
  if (email && !validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  return authController.forgotPassword(req, res);
});
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/change-password-admin', authMiddleware, authController.changePasswordAdmin);
// Get current authenticated user
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res));

export default router;
