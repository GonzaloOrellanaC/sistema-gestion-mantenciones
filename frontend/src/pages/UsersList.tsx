import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle, IonIcon } from '@ionic/react';
import * as usersApi from '../api/users';
import * as rolesApi from '../api/roles';
import sortByName from '../utils/sort';
import type { User } from '../api/types';
import './UsersList.css';
import { createOutline } from 'ionicons/icons';

const UsersList: React.FC = () => {
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
  const history = useHistory();
  const { t } = useTranslation();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await usersApi.listUsers({ page: p, limit, q: q || undefined });
      console.log('Loaded users', res);
      setItems(sortByName(res.items || []));
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try {
      const res = await rolesApi.listRoles({ limit: 200 });
      const map: Record<string, string> = {};
      (res.items || []).forEach((r: any) => { if (r && r._id) map[r._id] = r.name || r.displayName || r.title || r._id; });
      setRolesMap(map);
    } catch (err) {
      console.warn('roles load err', err);
    }
  };

  const onSearch = () => {
    setPage(1);
    load(1);
  };

  const next = () => {
    if (page * limit >= total) return;
    const np = page + 1;
    setPage(np);
    load(np);
  };

  const prev = () => {
    if (page <= 1) return;
    const np = page - 1;
    setPage(np);
    load(np);
  };

  return (
    <IonPage>
        <IonHeader className="ion-no-border">
            <IonToolbar style={{padding: '0px 10px'}}>
              <IonTitle>{t('usersList.title')}</IonTitle>
              <div className="toolbar-sub">{t('usersList.subtitle')}</div>
              <IonButton slot='end' color="primary" onClick={() => { history.push('/users/new'); }}>
                  {t('usersList.newUser')}
              </IonButton>
            </IonToolbar>
          </IonHeader>
      <IonContent className="users-page ion-padding">

        <div className="table-container users-table">
          <table>
            <thead>
              <tr>
                <th>{t('usersList.headers.user')}</th>
                <th>{t('usersList.headers.email')}</th>
                <th>{t('usersList.headers.role')}</th>
                <th>{t('usersList.headers.branch')}</th>
                <th>{t('usersList.headers.created')}</th>
                <th>{t('usersList.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">{(u.firstName?.[0]||'U') + (u.lastName?.[0]||'')}</div>
                      <div className="user-name">{u.firstName} {u.lastName}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{
                    (() => {
                      const rid = (u as any).roleId;
                      if (!rid) return '-';
                      if (typeof rid === 'object') return rid.name || rid.title || '-';
                      return rolesMap[rid] || rid;
                    })()
                  }</td>
                  <td>{(u as any).branchId ? ((u as any).branchId.name || (u as any).branchId) : '-'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                      <td>
                          <IonButton fill="clear" onClick={() => history.push(`/users/${u._id}/edit`)} >
                            <IonIcon slot="icon-only" icon={createOutline} />
                          </IonButton>
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>{t('usersList.showing', { count: items.length, total })}</div>
          <div>
            <IonButton onClick={prev} disabled={page<=1}>{t('usersList.prev')}</IonButton>
            <span style={{ margin: '0 8px' }}>{t('usersList.page')} {page}</span>
            <IonButton onClick={next} disabled={page*limit >= total}>{t('usersList.next')}</IonButton>
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default UsersList;
