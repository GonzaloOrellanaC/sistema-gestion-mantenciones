import { Request, Response } from 'express';
import * as rolesService from '../services/rolesService';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const role = await rolesService.createRole(orgId, req.body);
    return res.status(201).json(role);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const { page, limit, q } = req.query;
    const orgId = (req as any).user.orgId;
    const roles = await rolesService.listRoles(orgId, Number(page) || 1, Number(limit) || 10, String(q) || undefined);
    const response = {
      items: roles,
      total: roles.length,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    }
    return res.json(response);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const role = await rolesService.getRole(orgId, id);
    return res.json(role);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const role = await rolesService.updateRole(orgId, id, req.body);
    return res.json(role);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    await rolesService.deleteRole(orgId, id);
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list, getOne, update, remove };
