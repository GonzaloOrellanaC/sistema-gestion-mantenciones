import api from './axios';
import type { Template, PaginationResponse } from './types';

/**
 * GET /api/templates
 * List templates (supports query params for pagination/filtering)
 * Query params example: { page, limit, q }
 * Returns: { items: Template[], total, page, limit }
 */
export async function listTemplates(params?: Record<string, unknown>): Promise<PaginationResponse<Template>> {
  const { data } = await api.get('/api/templates', { params });
  return data;
}

/**
 * POST /api/templates
 * Create a new template.
 * Payload example: { name, description, structure }
 * Returns: created Template object
 */
export async function createTemplate(payload: Partial<Template>): Promise<Template> {
  const { data } = await api.post('/api/templates', payload);
  return data;
}

/**
 * GET /api/templates/:id/preview?device=mobile|desktop
 * Retrieve an HTML/JSON preview for a template formatted for a device.
 * Params: id (path param), device (query param)
 * Returns: preview content (string or structured preview)
 */
export async function getTemplatePreview(id: string, device: 'mobile' | 'desktop' = 'mobile'): Promise<unknown> {
  const { data } = await api.get(`/api/templates/${id}/preview`, { params: { device } });
  return data;
}

/**
 * GET /api/templates/:id
 * Get template by id
 */
export async function getTemplate(id: string): Promise<Template> {
  const { data } = await api.get(`/api/templates/${id}`);
  return data;
}

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<unknown> {
  const { data } = await api.delete(`/api/templates/${id}`);
  return data;
}

/**
 * PUT /api/templates/:id
 * Update an existing template
 */
export async function updateTemplate(id: string, payload: Partial<any>): Promise<any> {
  const { data } = await api.put(`/api/templates/${id}`, payload);
  return data;
}

export default { listTemplates, createTemplate, getTemplatePreview, getTemplate, deleteTemplate, updateTemplate };
