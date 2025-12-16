import { Request, Response } from 'express';
import * as countersService from '../services/countersService';

export async function getNext(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const next = await countersService.getNextSequence(orgId);
    return res.json({ next });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { getNext };
