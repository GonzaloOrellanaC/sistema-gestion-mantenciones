import { Request, Response } from 'express';
import DeviceModel from '../models/DeviceModel';
import Brand from '../models/Brand';
import AssetType from '../models/AssetType';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { brandId, typeId } = req.body;
    // ensure brand and type exist
    const brand = await Brand.findOne({ _id: brandId, orgId }).lean();
    if (!brand) return res.status(400).json({ message: 'Brand not found' });
    const type = await AssetType.findOne({ _id: typeId, orgId }).lean();
    if (!type) return res.status(400).json({ message: 'Type not found' });

    const doc = await DeviceModel.create({ orgId, ...req.body });
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const docs = await DeviceModel.find({ orgId }).populate('brandId').populate('typeId').sort({ name: 1 }).lean();
    return res.json({ items: docs });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const doc = await DeviceModel.findOne({ _id: id, orgId }).populate('brandId').populate('typeId').lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const doc = await DeviceModel.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    await DeviceModel.findOneAndDelete({ _id: id, orgId });
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list, getOne, update, remove };
