import api from './axios';

export type OrganizationPayload = {
  name?: string;
  meta?: any;
  address?: any;
  contact?: any;
  logoUrl?: string;
};

export async function getOrganization() {
  const { data } = await api.get('/api/organizations');
  return data;
}

export async function updateOrganization(payload: OrganizationPayload) {
  const { data } = await api.put('/api/organizations', payload);
  return data;
}

export async function uploadImage(file: File, type: 'logo' | 'isotype') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('type', type);
  const { data } = await api.post('/api/organizations/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}

export default { getOrganization, updateOrganization, uploadImage };
