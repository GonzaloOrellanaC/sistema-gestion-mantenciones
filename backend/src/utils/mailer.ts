import dotenv from 'dotenv';
dotenv.config();

const impl = process.env.MAIL_SYS === 'mailgun' ? require('./mailgun') : require('./nodemailer');

export const sendWelcomeEmail = impl.sendWelcomeEmail as (to: string, confirmLink: string, name?: string) => Promise<any> | void;
export const sendPasswordResetEmail = impl.sendPasswordResetEmail as (to: string, resetLink: string) => Promise<any> | void;
export const sendNotificationEmail = impl.sendNotificationEmail as (to: string, subject: string, bodyHtml: string, template?: string) => Promise<any> | void;

export default impl;
