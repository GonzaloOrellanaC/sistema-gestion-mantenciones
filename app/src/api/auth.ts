import api from './axios';

export async function loginApi(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  // support token in different shapes
  return res.data.token || res.data.accessToken || res.data;
}

export async function meApi() {
  const res = await api.get('/auth/me');
  return res.data;
}

export default {
  loginApi,
  meApi,
};
