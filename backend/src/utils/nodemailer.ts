import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import EmailLog from '../models/EmailLog';
dotenv.config();

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
  // Replace anchor tags with "text (url)"
  let txt = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)');
  // Remove remaining tags
  txt = txt.replace(/<[^>]+>/g, '');
  // Decode common HTML entities (basic)
  txt = txt.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Collapse whitespace
  return txt.replace(/\s+/g, ' ').trim();
}

const defaultLogo = process.env.MAIL_DEFAULT_LOGO || `${process.env.FRONTEND_URL || 'http://localhost:5100'}/assets/sgm-logo.svg`;

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transporter = smtpHost ? nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
}) : null as any;

async function logSkipped(to: string, subject: string, template: string, body: string) {
  try { await EmailLog.create({ to, subject, template, body, result: { skipped: true } }); } catch (e) { console.error('Failed to write EmailLog', e); }
}

export async function sendWelcomeEmail(to: string, confirmLink: string, name?: string) {
  const subject = 'Bienvenido - Sistema de Gestión';
  const tpl = readTemplate('welcome.html');
  const nameSection = name ? ` ${name}` : '';
  const preheader = `Confirma tu cuenta para completar el registro en Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, confirmLink, nameSection, preheader, plainText: `Bienvenido a Sistema de Gestión. Confirma tu cuenta: ${confirmLink}` }) : `<p>Bienvenido. Confirma en: <a href="${confirmLink}">${confirmLink}</a></p>`;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!transporter) {
    console.warn('SMTP not configured; skipping sending email');
    await logSkipped(to, subject, 'welcome', body);
    return;
  }

  // Compute a safe From address to avoid rejections like "no-reply@localhost"
  const smtpFromEnv = process.env.SMTP_FROM || process.env.MAIL_FROM || '';
  let fromAddress = '';
  if (smtpFromEnv) {
    fromAddress = smtpFromEnv.includes('@') ? smtpFromEnv : `no-reply@${smtpFromEnv}`;
  } else if (smtpUser && smtpUser.includes('@')) {
    fromAddress = smtpUser;
  } else if (process.env.FRONTEND_URL) {
    try {
      const host = new URL(process.env.FRONTEND_URL).hostname;
      fromAddress = `no-reply@${host}`;
    } catch (e) {
      fromAddress = 'no-reply@example.com';
    }
  } else {
    fromAddress = 'no-reply@example.com';
  }
  const data = { from: fromAddress, to, subject, html: body, text };
  try {
    const info = await transporter.sendMail(data);
    try { await EmailLog.create({ to, subject, template: 'welcome', body, result: info }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    return info;
  } catch (err: any) {
    console.error('SMTP error', err);
    try { await EmailLog.create({ to, subject, template: 'welcome', body, result: err }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    throw new Error('No se pudo enviar el correo de bienvenida.');
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const subject = 'Recuperar contraseña - Sistema de Gestión';
  const tpl = readTemplate('password_reset.html');
  const preheader = `Restablece tu contraseña de Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, resetLink, preheader, plainText: `Restablecer contraseña: ${resetLink}` }) : `<p>Has solicitado recuperar tu contraseña. Enlace: <a href="${resetLink}">${resetLink}</a></p>`;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!transporter) {
    console.warn('SMTP not configured; skipping sending email');
    await logSkipped(to, subject, 'password_reset', body);
    return;
  }

  const smtpFromEnv2 = process.env.SMTP_FROM || process.env.MAIL_FROM || '';
  let fromAddress2 = '';
  if (smtpFromEnv2) {
    fromAddress2 = smtpFromEnv2.includes('@') ? smtpFromEnv2 : `no-reply@${smtpFromEnv2}`;
  } else if (smtpUser && smtpUser.includes('@')) {
    fromAddress2 = smtpUser;
  } else if (process.env.MAIL_FROM_DOMAIN) {
    fromAddress2 = `no-reply@${process.env.MAIL_FROM_DOMAIN}`;
  } else if (process.env.FRONTEND_URL) {
    try {
      const host = new URL(process.env.FRONTEND_URL).hostname;
      fromAddress2 = `no-reply@${host}`;
    } catch (e) {
      fromAddress2 = 'no-reply@example.com';
    }
  } else {
    fromAddress2 = 'no-reply@example.com';
  }
  const data = { from: fromAddress2, to, subject, html: body, text };
  try {
    const info = await transporter.sendMail(data);
    try { await EmailLog.create({ to, subject, template: 'password_reset', body, result: info }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    return info;
  } catch (err: any) {
    console.error('SMTP error', err);
    try { await EmailLog.create({ to, subject, template: 'password_reset', body, result: err }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    throw new Error('No se pudo enviar el correo de recuperación de contraseña.');
  }
}

export async function sendNotificationEmail(to: string, subject: string, bodyHtml: string, template = 'notification') {
  const tpl = readTemplate('notification.html');
  const preheader = `Tienes una nueva notificación en Sistema de Gestión.`;
  const htmlBody = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, message: bodyHtml, actionUrl: '', preheader, plainText: bodyHtml }) : bodyHtml;
  const body = htmlBody;
  const text = htmlToText(body);

  if (!transporter) {
    console.warn('SMTP not configured; skipping sending email');
    await logSkipped(to, subject, template, body);
    return;
  }

  const smtpFromEnv3 = process.env.SMTP_FROM || process.env.MAIL_FROM || '';
  let fromAddress3 = '';
  if (smtpFromEnv3) {
    fromAddress3 = smtpFromEnv3.includes('@') ? smtpFromEnv3 : `no-reply@${smtpFromEnv3}`;
  } else if (smtpUser && smtpUser.includes('@')) {
    fromAddress3 = smtpUser;
  } else if (process.env.MAIL_FROM_DOMAIN) {
    fromAddress3 = `no-reply@${process.env.MAIL_FROM_DOMAIN}`;
  } else if (process.env.FRONTEND_URL) {
    try {
      const host = new URL(process.env.FRONTEND_URL).hostname;
      fromAddress3 = `no-reply@${host}`;
    } catch (e) {
      fromAddress3 = 'no-reply@example.com';
    }
  } else {
    fromAddress3 = 'no-reply@example.com';
  }
  const data = { from: fromAddress3, to, subject, html: body, text };
  try {
    const info = await transporter.sendMail(data);
    try { await EmailLog.create({ to, subject, template, body, result: info }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    return info;
  } catch (err: any) {
    console.error('SMTP error', err);
    try { await EmailLog.create({ to, subject, template, body, result: err }); } catch (logErr) { console.error('Failed to write EmailLog', logErr); }
    throw new Error('No se pudo enviar el correo de notificación.');
  }
}

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
