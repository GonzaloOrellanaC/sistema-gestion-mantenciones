"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const impl = process.env.MAIL_SYS === 'mailgun' ? require('./mailgun') : require('./nodemailer');
exports.sendWelcomeEmail = impl.sendWelcomeEmail;
exports.sendPasswordResetEmail = impl.sendPasswordResetEmail;
exports.sendNotificationEmail = impl.sendNotificationEmail;
exports.default = impl;
