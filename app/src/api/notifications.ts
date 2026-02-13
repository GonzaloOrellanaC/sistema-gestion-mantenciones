import api from './axios';

type GetNotificationsOpts = { page?: number; limit?: number; userId?: string; raw?: boolean };

export async function getNotifications(opts: GetNotificationsOpts = {}) {
  const { page = 1, limit = 10, userId, raw = false } = opts;
  const params: any = { page, limit };
  if (userId) params.userId = userId;

  const res = await api.get('/notifications', { params });
  if (raw) return res.data;
  return res.data && res.data.items ? res.data.items : res.data;
}

export async function markAsRead(id: string) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
}

export async function getUnreadCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data && typeof res.data.count === 'number' ? res.data.count : 0;
}

export default { getNotifications, markAsRead, getUnreadCount };
