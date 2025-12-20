"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextSequence = getNextSequence;
const Counter_1 = __importDefault(require("../models/Counter"));
const mongoose_1 = __importDefault(require("mongoose"));
async function getNextSequence(orgId) {
    if (!mongoose_1.default.Types.ObjectId.isValid(orgId))
        throw { status: 400, message: 'Invalid orgId' };
    const result = await Counter_1.default.findOneAndUpdate({ orgId }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
    if (!result)
        throw { status: 500, message: 'Could not get next sequence' };
    return result.seq;
}
exports.default = { getNextSequence };
