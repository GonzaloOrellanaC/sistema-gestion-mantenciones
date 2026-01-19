import axios from './axios';

export async function listBranches(params: any = {}) {
  const res = await axios.get('/api/branches', { params });
  return res.data || { items: [] };
}

export async function createBranch(payload: any) {
  const res = await axios.post('/api/branches', payload);
  return res.data;
}

export async function getBranch(id: string) {
  const res = await axios.get(`/api/branches/${id}`);
  return res.data;
}

export default { listBranches, createBranch, getBranch };