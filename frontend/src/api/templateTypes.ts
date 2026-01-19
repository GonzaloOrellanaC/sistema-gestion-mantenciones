import axios from './axios';

export async function listTemplateTypes(params: any = {}) {
  const res = await axios.get('/api/template-types', { params });
  return res.data || { items: [] };
}

export async function createTemplateType(payload: any) {
  const res = await axios.post('/api/template-types', payload);
  return res.data;
}

export default { listTemplateTypes, createTemplateType };
