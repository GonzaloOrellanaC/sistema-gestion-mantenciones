import { Request, Response } from 'express';
import Mailgun from '../utils/mailgun';
import NodeMailer from '../utils/nodemailer';

const mailSys = process.env.MAIL_SYS || 'nodemailer';
const mailer = mailSys === 'mailgun' ? Mailgun : NodeMailer;

function forbiddenInProduction(res: Response) {
  return res.status(403).json({ message: 'Dev endpoints are disabled in production' });
}

export async function sendTestEmail(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') return forbiddenInProduction(res);

  const { to, type, subject, message, name, confirmLink, resetLink, actionUrl } = req.body || {};
  if (!to || !type) return res.status(400).json({ message: 'Missing required fields: to, type' });

  try {
    let result: any = null;
    if (type === 'welcome') {
      const link = confirmLink || `${process.env.FRONTEND_URL || 'http://localhost:5100'}/auth/confirm-email/test-token`;
      result = await mailer.sendWelcomeEmail(to, link, name);
    } else if (type === 'password_reset') {
      const link = resetLink || `${process.env.FRONTEND_URL || 'http://localhost:5100'}/reset-password?token=test-token`;
      result = await mailer.sendPasswordResetEmail(to, link);
    } else if (type === 'notification') {
      const subj = subject || 'Prueba de notificación - Sistema de Gestión';
      const body = message || 'Este es un mensaje de prueba desde el endpoint de desarrollo.';
      const url = actionUrl || `${process.env.FRONTEND_URL || 'http://localhost:5100'}`;
      result = await mailer.sendNotificationEmail(to, subj, body, 'notification');
    } else {
      return res.status(400).json({ message: 'Unknown type. Use welcome|password_reset|notification' });
    }
    return res.json({ ok: true, result });
  } catch (err: any) {
    console.error('sendTestEmail error', err);
    return res.status(500).json({ ok: false, message: err?.message || 'Error sending test email', err });
  }
}

export default {
  sendTestEmail,
};
