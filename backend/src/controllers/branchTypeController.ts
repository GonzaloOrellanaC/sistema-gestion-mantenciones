import { Request, Response } from 'express';
import BranchType from '../models/BranchType';

export async function getBranchTypes(req: Request, res: Response) {
  try {
    const types = await BranchType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tipos de sucursal' });
  }
}
