import api from './axios';

export async function getNotifications() {
  const res = await api.get('/api/notifications');
  return res.data && res.data.items ? res.data.items : res.data;
}

export async function markAsRead(id: string) {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
}

export async function getUnreadCount() {
  const res = await api.get('/api/notifications/unread-count');
  return res.data && typeof res.data.count === 'number' ? res.data.count : 0;
}

export default { getNotifications, markAsRead, getUnreadCount };
