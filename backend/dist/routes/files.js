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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("../middleware/auth"));
const FileMeta_1 = __importDefault(require("../models/FileMeta"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const router = (0, express_1.Router)();
// use env var or default
const FILES_DIR = process.env.FILES_DIR || path_1.default.join(process.cwd(), 'backend', 'files');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        try {
            const orgId = req.user?.orgId || 'unknown';
            const type = req.body.type || 'misc';
            const dir = path_1.default.join(FILES_DIR, orgId.toString(), type);
            fs_1.default.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)), '');
        }
    },
    filename: (req, file, cb) => {
        try {
            const ts = Date.now();
            const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            cb(null, `${ts}_${safe}`);
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)), '');
        }
    }
});
function fileFilter(req, file, cb) {
    const allowed = [
        'image/jpeg', 'image/png', 'image/jpg',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype))
        return cb(null, true);
    // reject unsupported mimetypes without throwing an error to the uploader
    return cb(null, false);
}
exports.upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
router.use(auth_1.default);
// upload file and optionally attach to a work order
router.post('/upload', exports.upload.single('file'), async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!req.file)
            return res.status(400).json({ message: 'No file' });
        const metaData = {
            orgId,
            uploaderId: req.user?.id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            storage: 'local',
            path: req.file.path
        };
        // if image, create thumbnail (optional)
        if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
            const { generateThumbnail } = await Promise.resolve().then(() => __importStar(require('../utils/image')));
            const thumbName = `thumb_${req.file.filename}`;
            const thumbPath = path_1.default.join(path_1.default.dirname(req.file.path), thumbName);
            try {
                await generateThumbnail(req.file.path, thumbPath, 300);
                metaData.meta = { thumbnailPath: thumbPath };
            }
            catch (e) {
                console.warn('thumbnail generation failed', e);
            }
        }
        const meta = await FileMeta_1.default.create(metaData);
        // if workOrderId provided, attach
        const workOrderId = req.body.workOrderId;
        if (workOrderId) {
            await WorkOrder_1.default.findOneAndUpdate({ _id: workOrderId, orgId }, { $push: { attachments: meta._id } });
        }
        return res.json({ meta });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
});
exports.default = router;
