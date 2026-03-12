import api from './axios';

export async function getBranchTypes() {
  const res = await api.get('/api/branch-types');
  return res.data;
}
