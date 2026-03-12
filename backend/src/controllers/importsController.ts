import { Request, Response } from 'express';
import excelImportService from '../services/excelImportService';

export const importExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const lang = (req.body?.lang || req.query?.lang || 'es').toString().toLowerCase();

    const result = await excelImportService.parseWorkbook(req.file.buffer, lang === 'en' ? 'en' : 'es');
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    console.error('importExcel error', err);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to parse file' });
  }
};

export default { importExcel };
