"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendNotificationEmail = sendNotificationEmail;
const mailgun_js_1 = __importDefault(require("mailgun-js"));
const dotenv_1 = __importDefault(require("dotenv"));
const EmailLog_1 = __importDefault(require("../models/EmailLog"));
dotenv_1.default.config();
const apiKey = process.env.MAILGUN_API_KEY || '';
const domain = process.env.MAILGUN_DOMAIN || '';
const mg = apiKey && domain ? (0, mailgun_js_1.default)({ apiKey, domain }) : null;
function passwordResetTemplate(resetLink) {
    return `<div style="font-family: Arial, sans-serif; font-size:14px; color:#222;"><p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Si no solicitaste esto, ignora este correo.</p></div>`;
}
async function sendPasswordResetEmail(to, resetLink) {
    const subject = 'Recuperar contraseña - Sistema de Gestión';
    const body = passwordResetTemplate(resetLink);
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
    const data = {
        from: `no-reply@${domain}`,
        to,
        subject,
        html: body
    };
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
                return reject(err);
            }
            resolve(bodyRes);
        });
    });
}
async function sendNotificationEmail(to, subject, body, template = 'notification') {
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
    const data = {
        from: `no-reply@${domain}`,
        to,
        subject,
        html: body
    };
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
                return reject(err);
            }
            resolve(bodyRes);
        });
    });
}
