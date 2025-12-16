import mailgunFactory from 'mailgun-js';
import dotenv from 'dotenv';
import EmailLog from '../models/EmailLog';
dotenv.config();

const apiKey = process.env.MAILGUN_API_KEY || '';
const domain = process.env.MAILGUN_DOMAIN || '';
const mg = apiKey && domain ? mailgunFactory({ apiKey, domain }) : null as any;

function passwordResetTemplate(resetLink: string) {
  return `<div style="font-family: Arial, sans-serif; font-size:14px; color:#222;"><p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Si no solicitaste esto, ignora este correo.</p></div>`;
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const subject = 'Recuperar contraseña - Sistema de Gestión';
  const body = passwordResetTemplate(resetLink);

  if (!mg) {
    console.warn('Mailgun not configured; skipping sending email');
    try {
      await EmailLog.create({ to, subject, template: 'password_reset', body, result: { skipped: true } });
    } catch (e) {
      console.error('Failed to write EmailLog', e);
    }
    return;
  }

  const data = {
    from: `no-reply@${domain}`,
    to,
    subject,
    html: body
  };

  return new Promise((resolve, reject) => {
    mg.messages().send(data, async (err: any, bodyRes: any) => {
      try {
        await EmailLog.create({ to, subject, template: 'password_reset', body, result: err || bodyRes });
      } catch (logErr) {
        console.error('Failed to write EmailLog', logErr);
      }

      if (err) {
        console.error('Mailgun error', err);
        return reject(err);
      }
      resolve(bodyRes);
    });
  });
}

export async function sendNotificationEmail(to: string, subject: string, body: string, template = 'notification') {
  if (!mg) {
    console.warn('Mailgun not configured; skipping sending email');
    try {
      await EmailLog.create({ to, subject, template, body, result: { skipped: true } });
    } catch (e) {
      console.error('Failed to write EmailLog', e);
    }
    return;
  }

  const data = {
    from: `no-reply@${domain}`,
    to,
    subject,
    html: body
  };

  return new Promise((resolve, reject) => {
    mg.messages().send(data, async (err: any, bodyRes: any) => {
      try {
        await EmailLog.create({ to, subject, template, body, result: err || bodyRes });
      } catch (logErr) {
        console.error('Failed to write EmailLog', logErr);
      }

      if (err) {
        console.error('Mailgun error', err);
        return reject(err);
      }
      resolve(bodyRes);
    });
  });
}
