"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Notification_1 = __importDefault(require("../models/Notification"));
const push_1 = require("../utils/push");
// Firebase removed: delegate push sending to utils/push (APN only now).
async function sendToUser(userId, payload) {
    try {
        // store notification in DB as well
        await Notification_1.default.create({ userId, message: payload.body, meta: payload.data || {}, read: false });
        // attempt native push via utils/push (will only handle APN per configuration)
        await (0, push_1.sendPushToUser)(userId, payload);
    }
    catch (e) {
        console.error('sendToUser err', e);
    }
}
exports.default = { sendToUser };
