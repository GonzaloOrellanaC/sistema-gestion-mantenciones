"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workOrdersController_1 = __importDefault(require("../controllers/workOrdersController"));
const FileMeta_1 = __importDefault(require("../models/FileMeta"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
jest.mock('../models/FileMeta');
jest.mock('../models/WorkOrder');
function makeReq(file, user, params, body, app) {
    return {
        file,
        user: user || { id: 'user1', orgId: 'org1' },
        params: params || { id: 'wo1' },
        body: body || {},
        app: { get: () => ({ to: () => ({ emit: () => { } }) }) }
    };
}
function makeRes() {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { res.payload = payload; return res; };
    return res;
}
describe('uploadAttachment handler', () => {
    beforeEach(() => {
        FileMeta_1.default.create.mockClear();
        WorkOrder_1.default.findOneAndUpdate.mockClear();
    });
    it('returns 400 when no file', async () => {
        const req = makeReq(undefined);
        const res = makeRes();
        await workOrdersController_1.default.uploadAttachment(req, res);
        expect(res.statusCode).toBe(400);
    });
    it('creates file meta and attaches to workorder', async () => {
        const fakeFile = { filename: 'f.jpg', originalname: 'orig.jpg', mimetype: 'image/jpeg', size: 123, path: '/tmp/f.jpg' };
        const req = makeReq(fakeFile);
        const res = makeRes();
        // mock workOrdersService.findById by patching the imported function inside controller via require cache
        const workOrdersService = require('../services/workOrdersService');
        workOrdersService.findById = jest.fn().mockResolvedValue({ _id: 'wo1', assigneeId: 'assignee1' });
        FileMeta_1.default.create.mockResolvedValue({ _id: 'meta1', filename: fakeFile.filename });
        WorkOrder_1.default.findOneAndUpdate.mockResolvedValue({ _id: 'wo1', attachments: ['meta1'] });
        await workOrdersController_1.default.uploadAttachment(req, res);
        expect(res.payload).toBeDefined();
        expect(res.payload.file).toBeDefined();
        expect(res.payload.workOrder).toBeDefined();
    });
});
