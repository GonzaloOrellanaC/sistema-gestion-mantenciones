import api from './axios';

export async function registerPushToken(token: string, platform?: string) {
  const res = await api.post('/api/push-tokens', { token, platform });
  return res.data;
}

export default { registerPushToken };
