import mailgunFactory from 'mailgun-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import EmailLog from '../models/EmailLog';
dotenv.config();

const apiKey = process.env.MAILGUN_API_KEY || '';
const domain = process.env.MAILGUN_DOMAIN || '';
const mg = apiKey && domain ? mailgunFactory({ apiKey, domain }) : null as any;

function readTemplate(name: string) {
  const filePath = path.join(__dirname, '../../templates', name);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.warn('Template not found:', filePath);
    return '';
  }
}

function renderTemplate(src: string, vars: Record<string, string>) {
  let out = src;
  Object.keys(vars).forEach(k => {
    const re = new RegExp('{{\\s*' + k + '\\s*}}', 'g');
    out = out.replace(re, vars[k] || '');
  });
  return out;
}

function htmlToText(html: string) {
  if (!html) return '';
  let txt = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)');
  txt = txt.replace(/<[^>]+>/g, '');
  txt = txt.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return txt.replace(/\s+/g, ' ').trim();
}

const defaultLogo = process.env.MAIL_DEFAULT_LOGO || `${process.env.FRONTEND_URL || 'http://localhost:5100'}/assets/sgm-logo.svg`;

export async function sendWelcomeEmail(to: string, confirmLink: string, name?: string) {
  const subject = 'Bienvenido - Sistema de Gestión';
  const tpl = readTemplate('welcome.html');
  const nameSection = name ? ` ${name}` : '';
  const preheader = `Confirma tu cuenta para completar el registro en Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, confirmLink, nameSection, preheader, plainText: `Bienvenido a Sistema de Gestión. Confirma tu cuenta: ${confirmLink}` }) : `<p>Bienvenido. Confirma en: <a href="${confirmLink}">${confirmLink}</a></p>`;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!mg) {
    console.warn('Mailgun not configured; skipping sending email');
    try { await EmailLog.create({ to, subject, template: 'welcome', body, result: { skipped: true } }); } catch (e) { console.error('Failed to write EmailLog', e); }
    return;
  }

  const data = { from: `no-reply@${domain}`, to, subject, html: body, text };
  return new Promise((resolve, reject) => {
    mg.messages().send(data, async (err: any, bodyRes: any) => {
      try { await EmailLog.create({ to, subject, template: 'welcome', body, result: err || bodyRes }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
      if (err) {
        console.error('Mailgun error', err);
        return reject(new Error('No se pudo enviar el correo de bienvenida.'));
      }
      resolve(bodyRes);
    });
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const subject = 'Recuperar contraseña - Sistema de Gestión';
  const tpl = readTemplate('password_reset.html');
  const preheader = `Restablece tu contraseña de Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, resetLink, preheader, plainText: `Restablecer contraseña: ${resetLink}` }) : `<p>Has solicitado recuperar tu contraseña. Enlace: <a href="${resetLink}">${resetLink}</a></p>`;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!mg) {
    console.warn('Mailgun not configured; skipping sending email');
    try { await EmailLog.create({ to, subject, template: 'password_reset', body, result: { skipped: true } }); } catch (e) { console.error('Failed to write EmailLog', e); }
    return;
  }

  const data = { from: `no-reply@${domain}`, to, subject, html: body, text };
  return new Promise((resolve, reject) => {
    mg.messages().send(data, async (err: any, bodyRes: any) => {
      try { await EmailLog.create({ to, subject, template: 'password_reset', body, result: err || bodyRes }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
      if (err) {
        console.error('Mailgun error', err);
        return reject(new Error('No se pudo enviar el correo de recuperación de contraseña.'));
      }
      resolve(bodyRes);
    });
  });
}

export async function sendNotificationEmail(to: string, subject: string, bodyHtml: string, template = 'notification') {
  const tpl = readTemplate('notification.html');
  const preheader = `Tienes una nueva notificación en Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, message: bodyHtml, actionUrl: '', preheader, plainText: bodyHtml }) : bodyHtml;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!mg) {
    console.warn('Mailgun not configured; skipping sending email');
    try { await EmailLog.create({ to, subject, template, body, result: { skipped: true } }); } catch (e) { console.error('Failed to write EmailLog', e); }
    return;
  }

  const data = { from: `no-reply@${domain}`, to, subject, html: body, text };
  return new Promise((resolve, reject) => {
    mg.messages().send(data, async (err: any, bodyRes: any) => {
      try { await EmailLog.create({ to, subject, template, body, result: err || bodyRes }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
      if (err) {
        console.error('Mailgun error', err);
        return reject(new Error('No se pudo enviar el correo de notificación.'));
      }
      resolve(bodyRes);
    });
  });
}

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
