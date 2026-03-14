"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendNotificationEmail = sendNotificationEmail;
const mailgun_js_1 = __importDefault(require("mailgun-js"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const EmailLog_1 = __importDefault(require("../models/EmailLog"));
dotenv_1.default.config();
const apiKey = process.env.MAILGUN_API_KEY || '';
const domain = process.env.MAILGUN_DOMAIN || '';
const mg = apiKey && domain ? (0, mailgun_js_1.default)({ apiKey, domain }) : null;
function readTemplate(name) {
    const filePath = path_1.default.join(__dirname, '../../templates', name);
    try {
        return fs_1.default.readFileSync(filePath, 'utf8');
    }
    catch (e) {
        console.warn('Template not found:', filePath);
        return '';
    }
}
function renderTemplate(src, vars) {
    let out = src;
    Object.keys(vars).forEach(k => {
        const re = new RegExp('{{\\s*' + k + '\\s*}}', 'g');
        out = out.replace(re, vars[k] || '');
    });
    return out;
}
const defaultLogo = process.env.MAIL_DEFAULT_LOGO || `${process.env.FRONTEND_URL || 'http://localhost:5100'}/assets/sgm-logo.svg`;
async function sendWelcomeEmail(to, confirmLink, name) {
    const subject = 'Bienvenido - Sistema de Gestión';
    const tpl = readTemplate('welcome.html');
    const nameSection = name ? ` ${name}` : '';
    const body = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, confirmLink, nameSection }) : `<p>Bienvenido. Confirma en: <a href="${confirmLink}">${confirmLink}</a></p>`;
    if (!mg) {
        console.warn('Mailgun not configured; skipping sending email');
        try {
            await EmailLog_1.default.create({ to, subject, template: 'welcome', body, result: { skipped: true } });
        }
        catch (e) {
            console.error('Failed to write EmailLog', e);
        }
        return;
    }
    const data = { from: `no-reply@${domain}`, to, subject, html: body };
    return new Promise((resolve, reject) => {
        mg.messages().send(data, async (err, bodyRes) => {
            try {
                await EmailLog_1.default.create({ to, subject, template: 'welcome', body, result: err || bodyRes });
            }
            catch (logErr) {
                console.error('Failed to write EmailLog', logErr);
            }
            if (err) {
                console.error('Mailgun error', err);
                // Lanzar error para que el controlador pueda responder al cliente
                return reject(new Error('No se pudo enviar el correo de bienvenida.'));
            }
            resolve(bodyRes);
        });
    });
}
async function sendPasswordResetEmail(to, resetLink) {
    const subject = 'Recuperar contraseña - Sistema de Gestión';
    const tpl = readTemplate('password_reset.html');
    const body = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, resetLink }) : `<p>Has solicitado recuperar tu contraseña. Enlace: <a href="${resetLink}">${resetLink}</a></p>`;
    if (!mg) {
        console.warn('Mailgun not configured; skipping sending email');
        try {
            await EmailLog_1.default.create({ to, subject, template: 'password_reset', body, result: { skipped: true } });
        }
        catch (e) {
            console.error('Failed to write EmailLog', e);
        }
        return;
    }
    const data = { from: `no-reply@${domain}`, to, subject, html: body };
    return new Promise((resolve, reject) => {
        mg.messages().send(data, async (err, bodyRes) => {
            try {
                await EmailLog_1.default.create({ to, subject, template: 'password_reset', body, result: err || bodyRes });
            }
            catch (logErr) {
                console.error('Failed to write EmailLog', logErr);
            }
            if (err) {
                console.error('Mailgun error', err);
                // Lanzar error para que el controlador pueda responder al cliente
                return reject(new Error('No se pudo enviar el correo de recuperación de contraseña.'));
            }
            resolve(bodyRes);
        });
    });
}
async function sendNotificationEmail(to, subject, bodyHtml, template = 'notification') {
    const tpl = readTemplate('notification.html');
    const body = tpl ? renderTemplate(tpl, { logoUrl: defaultLogo, message: bodyHtml, actionUrl: '' }) : bodyHtml;
    if (!mg) {
        console.warn('Mailgun not configured; skipping sending email');
        try {
            await EmailLog_1.default.create({ to, subject, template, body, result: { skipped: true } });
        }
        catch (e) {
            console.error('Failed to write EmailLog', e);
        }
        return;
    }
    const data = { from: `no-reply@${domain}`, to, subject, html: body };
    return new Promise((resolve, reject) => {
        mg.messages().send(data, async (err, bodyRes) => {
            try {
                await EmailLog_1.default.create({ to, subject, template, body, result: err || bodyRes });
            }
            catch (logErr) {
                console.error('Failed to write EmailLog', logErr);
            }
            if (err) {
                console.error('Mailgun error', err);
                // Lanzar error para que el controlador pueda responder al cliente
                return reject(new Error('No se pudo enviar el correo de notificación.'));
            }
            resolve(bodyRes);
        });
    });
}
