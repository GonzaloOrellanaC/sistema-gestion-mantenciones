"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const WorkOrderSchema = new mongoose_1.Schema({
    orgId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch' },
    orgSeq: { type: Number, required: true },
    templateId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Template' },
    data: { type: mongoose_1.Schema.Types.Mixed },
    state: { type: String, enum: ['Creado', 'Asignado', 'Iniciado', 'En revisión', 'Terminado'], default: 'Creado' },
    assigneeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    client: { type: mongoose_1.Schema.Types.Mixed },
    dates: { type: mongoose_1.Schema.Types.Mixed },
    history: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    attachments: { type: [mongoose_1.Schema.Types.ObjectId], default: [] },
    deleted: { type: Boolean, default: false }
});
// Ensure orgSeq is unique per organization
WorkOrderSchema.index({ orgId: 1, orgSeq: 1 }, { unique: true });
exports.default = mongoose_1.default.model('WorkOrder', WorkOrderSchema);
