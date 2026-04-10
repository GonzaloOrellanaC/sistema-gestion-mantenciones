import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonContent, IonBadge, IonCard, IonCardContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { markAsRead } from '../api/notifications';
import { useHistory } from 'react-router';
import { getWorkOrder } from '../api/workOrders';

const Notifications: React.FC = () => {
    const { user, setUnread } = useAuth() as any;
    const [items, setItems] = useState<any[]>([]);
    const history = useHistory();
    const { t } = useTranslation();

    function formatRelativeTime(inputDate: any, short = true) {
      try {
        const now = Date.now();
        const then = inputDate ? new Date(inputDate).getTime() : now;
        let diff = Math.floor((now - then) / 1000); // seconds
        if (diff < 0) diff = 0;

        if (diff < 60) {
          const count = diff;
          if (short) return `${count}${t('time.short.s')}`;
          const unit = t('time.units.second', { count });
          return t('time.ago', { count, unit });
        }
        const minutes = Math.floor(diff / 60);
        if (minutes < 60) {
          const count = minutes;
          if (short) return `${count}${t('time.short.m')}`;
          const unit = t('time.units.minute', { count });
          return t('time.ago', { count, unit });
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          const count = hours;
          if (short) return `${count}${t('time.short.h')}`;
          const unit = t('time.units.hour', { count });
          return t('time.ago', { count, unit });
        }
        const days = Math.floor(hours / 24);
        if (days < 30) {
          const count = days;
          if (short) return `${count}${t('time.short.d')}`;
          const unit = t('time.units.day', { count });
          return t('time.ago', { count, unit });
        }
        const months = Math.floor(days / 30);
        if (months < 12) {
          const count = months;
          if (short) return `${count}${t('time.short.mo')}`;
          const unit = t('time.units.month', { count });
          return t('time.ago', { count, unit });
        }
        const years = Math.floor(months / 12);
        const count = years;
        if (short) return `${count}${t('time.short.y') || t('time.short.a')}`;
        const unit = t('time.units.year', { count });
        return t('time.ago', { count, unit });
      } catch (e) {
        return '';
      }
    }

    useEffect(() => {
      let mounted = true;
      async function load() {
        try {
          const raw = localStorage.getItem('notifications');
          const list = raw ? JSON.parse(raw) : [];

          const ids: any[] = Array.from(new Set(list.map((n: any) => n.meta && n.meta.workOrderId).filter(Boolean)));
          const map: Record<string, any> = {};
          await Promise.all(ids.map(async (id: string) => {
            try {
              const wo = await getWorkOrder(id);
              if (wo && wo.orgSeq) map[id] = wo;
            } catch (e) {
              // ignore
            }
          }));

          const enriched = list.map((n: any) => {
            try {
              if (typeof n.message === 'string' && n.message.indexOf('.') >= 0) {
                const meta = { ...(n.meta || {}) };
                if (meta.workOrderId && map[meta.workOrderId]) meta.orgSeq = map[meta.workOrderId].orgSeq;
                const translated = t(n.message, meta);
                return { ...n, _displayMessage: translated };
              }
            } catch (e) {}
            return { ...n, _displayMessage: n.message };
          });

          if (mounted) setItems(enriched);
        } catch (e) {
          if (mounted) setItems([]);
        }
      }
      load();
      return () => { mounted = false; };
    }, [user, t]);

    function getIndicatorColor(n: any) {
      try {
        const readColor = '#A5D6A7';
        const defaultUnread = '#FF7043';
        const msgKey = (n && n.message && typeof n.message === 'string') ? n.message.toLowerCase() : '';
        const disp = (n && n._displayMessage && typeof n._displayMessage === 'string') ? n._displayMessage.toLowerCase() : '';
        // check for rejected / approved in key first
        if (msgKey.includes('rejected') || msgKey.includes('reject')) return '#D32F2F';
        if (msgKey.includes('approved') || msgKey.includes('approve')) return '#A5D6A7';
        // fallback to display message (handles localized strings)
        if (disp.includes('rechaz') || disp.includes('rechazado') || disp.includes('rechazada')) return '#D32F2F';
        if (disp.includes('aprob') || disp.includes('aprobado') || disp.includes('aprobada')) return '#A5D6A7';
        // default based on read state
        return n && n.read ? readColor : defaultUnread;
      } catch (e) {
        return (n && n.read) ? '#A5D6A7' : '#FF7043';
      }
    }

    async function handleClick(n: any) {
      try {
        if (!n.read) {
          await markAsRead(n._id || n.id);
          const updated = items.map(it => it._id === n._id ? { ...it, read: true } : it);
          setItems(updated);
          localStorage.setItem('notifications', JSON.stringify(updated));
          try { const raw = localStorage.getItem('notifications'); const arr = raw ? JSON.parse(raw) : []; setUnread && setUnread(arr.filter((x:any)=>!x.read).length); } catch (e) {}
        }
      } catch (e) {
        console.error('mark read err', e);
      }
      try {
        const workId = n.meta?.workOrderId || n.meta?.workOrderId;
        if (workId) history.push(`/work-orders/${workId}`);
      } catch (e) {}
    }

    return (
      <IonPage>
        <IonHeader className='ion-no-border'>
          <div style={{
            margin: 0,
            borderRadius: '0px 0px 20px 20px',
            padding: 18,
            background: 'var(--ion-color-primary)',
            color: 'white',
            position: 'relative',
            boxShadow: '0 6px 18px rgba(2,40,71,0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{t('notifications_title') || 'Notificaciones'}</div>
                <div style={{ marginTop: 8, fontSize: 14, opacity: 0.95 }}>{items.length} {t('pending') || 'pendientes'}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                N
              </div>
            </div>
          </div>
        </IonHeader>

        <IonContent>
          <div style={{ padding: '0 16px' }}>
            {items.length === 0 && <div style={{ padding: 16 }}>{t('no_notifications') || 'No hay notificaciones.'}</div>}

            {items.map((n: any, idx: number) => (
              <div key={n._id || n.id || idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 14, cursor: 'pointer' }} onClick={() => handleClick(n)}>
                <div style={{ width: 6, height: 80, borderRadius: 6, background: getIndicatorColor(n), marginRight: 12 }} />
                <div style={{ flex: 1 }}>
                  <IonCard style={{ borderRadius: 12, boxShadow: '0 6px 18px rgba(2,40,71,0.06)' }}>
                    <IonCardContent style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{n._displayMessage || n.message}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <IonBadge color={n.read ? 'medium' : 'danger'}>{formatRelativeTime(n.createdAt)}</IonBadge>
                        </div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>
                        {n.meta?.orgSeq ? t('ot_prefix', { id: n.meta.orgSeq }) : ''}
                      </div>
                    </IonCardContent>
                  </IonCard>
                </div>
              </div>
            ))}
          </div>
        </IonContent>
      </IonPage>
    );
  };

  export default Notifications;
