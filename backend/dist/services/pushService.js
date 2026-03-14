"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Notification_1 = __importDefault(require("../models/Notification"));
const push_1 = require("../utils/push");
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
// Firebase removed: delegate push sending to utils/push (APN only now).
async function sendToUser(userId, payload) {
    try {
        // store notification in DB as well; enrich meta with orgSeq when possible
        const meta = Object.assign({}, payload.data || {});
        try {
            if (meta.workOrderId) {
                const wo = await WorkOrder_1.default.findById(meta.workOrderId).lean();
                if (wo && wo.orgSeq)
                    meta.orgSeq = wo.orgSeq;
            }
        }
        catch (e) {
            // ignore
        }
        await Notification_1.default.create({ userId, message: payload.body, meta, read: false });
        // attempt native push via utils/push (will only handle APN per configuration)
        await (0, push_1.sendPushToUser)(userId, payload);
    }
    catch (e) {
        console.error('sendToUser err', e);
    }
}
exports.default = { sendToUser };
