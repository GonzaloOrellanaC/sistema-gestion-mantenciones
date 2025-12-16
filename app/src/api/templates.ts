import api from './axios';

export type TemplateDTO = {
  _id: string;
  name: string;
  structure?: any;
  createdBy?: string;
  createdAt?: string;
};

export async function getTemplates(orgId?: string) {
  const path = orgId ? `/orgs/${orgId}/templates` : '/templates';
  const res = await api.get(path);
  return res.data;
}

export async function getTemplate(id: string) {
  const res = await api.get(`/templates/${id}`);
  return res.data;
}

export default { getTemplates };
