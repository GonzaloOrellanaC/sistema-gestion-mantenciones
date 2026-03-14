import { Request, Response } from 'express';
import ShareToken from '../models/ShareToken';
import WorkOrder from '../models/WorkOrder';
import FileMeta from '../models/FileMeta';

// Public endpoint to fetch a work order timeline by token
export async function getWorkOrderByToken(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const st = await ShareToken.findOne({ token }).lean();
    if (!st) return res.status(404).json({ message: 'Token not found' });
    if (st.revoked) return res.status(403).json({ message: 'Token revoked' });
    if (st.expiresAt && new Date() > new Date(st.expiresAt)) return res.status(410).json({ message: 'Token expired' });

    const wo = await WorkOrder.findById(st.workOrderId).lean();
    if (!wo) return res.status(404).json({ message: 'Work order not found' });
    // Ensure token belongs to same org
    if (String(wo.orgId) !== String(st.orgId)) return res.status(403).json({ message: 'Token does not match organization' });

    // Populate attachments urls
    let attachments: any[] = [];
    if (Array.isArray(wo.attachments) && wo.attachments.length) {
      attachments = await FileMeta.find({ _id: { $in: wo.attachments } }).lean();
    }

    const woAny = wo as any;
    const result = {
      id: wo._id,
      orgSeq: wo.orgSeq,
      createdAt: wo.dates?.created || woAny.createdAt,
      state: wo.state || woAny.status,
      progress: wo.progress ?? woAny.progressPercent ?? (wo.data && (wo.data.progress || wo.data.progressPercent)),
      dates: wo.dates || {},
      history: Array.isArray(wo.history) ? wo.history : [],
      attachments: attachments.map(a => ({ url: a.url, filename: a.originalName || a.filename }))
    };

    return res.json({ workOrder: result });
  } catch (err: any) {
    console.error('public getWorkOrderByToken err', err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

export default { getWorkOrderByToken };
