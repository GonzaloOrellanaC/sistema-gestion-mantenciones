import workOrdersController from '../controllers/workOrdersController';
import FileMeta from '../models/FileMeta';
import WorkOrder from '../models/WorkOrder';

jest.mock('../models/FileMeta');
jest.mock('../models/WorkOrder');

function makeReq(file?: any, user?: any, params?: any, body?: any, app?: any) {
  return {
    file,
    user: user || { id: 'user1', orgId: 'org1' },
    params: params || { id: 'wo1' },
    body: body || {},
    app: { get: () => ({ to: () => ({ emit: () => {} }) }) }
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res.payload = payload; return res; };
  return res;
}

describe('uploadAttachment handler', () => {
  beforeEach(() => {
    (FileMeta.create as any).mockClear();
    (WorkOrder.findOneAndUpdate as any).mockClear();
  });

  it('returns 400 when no file', async () => {
    const req = makeReq(undefined);
    const res = makeRes();
    await workOrdersController.uploadAttachment(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('creates file meta and attaches to workorder', async () => {
    const fakeFile = { filename: 'f.jpg', originalname: 'orig.jpg', mimetype: 'image/jpeg', size: 123, path: '/tmp/f.jpg' };
    const req = makeReq(fakeFile);
    const res = makeRes();

    // mock workOrdersService.findById by patching the imported function inside controller via require cache
    const workOrdersService = require('../services/workOrdersService');
    workOrdersService.findById = jest.fn().mockResolvedValue({ _id: 'wo1', assigneeId: 'assignee1' });

    (FileMeta.create as any).mockResolvedValue({ _id: 'meta1', filename: fakeFile.filename });
    (WorkOrder.findOneAndUpdate as any).mockResolvedValue({ _id: 'wo1', attachments: ['meta1'] });

    await workOrdersController.uploadAttachment(req, res);
    expect(res.payload).toBeDefined();
    expect(res.payload.file).toBeDefined();
    expect(res.payload.workOrder).toBeDefined();
  });
});
