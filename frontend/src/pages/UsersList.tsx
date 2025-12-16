import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast } from '@ionic/react';
import * as usersApi from '../api/users';
import type { User } from '../api/types';
import './UsersList.css';

const UsersList: React.FC = () => {
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await usersApi.listUsers({ page: p, limit, q: q || undefined });
      console.log('Loaded users', res);
      setItems(res.items || []);
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
      <IonContent className="users-page ion-padding">
        <IonHeader className="users-header-toolbar ion-no-border">
          <IonToolbar>
            <div className="users-toolbar-left">
              <h2 className="toolbar-title">Gestión de Usuarios</h2>
              <div className="toolbar-sub">Administra tu equipo y sus roles</div>
            </div>
            <div slot="end">
              <IonButton color="primary" onClick={() => { history.push('/users/new'); }}>
                Nuevo Usuario
              </IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        {/* <IonGrid className="users-controls">
          <IonRow>
            <IonCol size="8" className="users-search-col">
              <Input type="text" placeholder="Buscar por nombre o email" value={q} onInput={(e: any) => setQ(e.detail?.value ?? '')} name="q" />
            </IonCol>
            <IonCol size="4" className="users-search-col">
              <IonButton expand="block" onClick={onSearch}>Buscar</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid> */}

        <div className="table-container users-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Creado</th>
                <th>Acciones</th>
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
                  <td>{/* TODO: resolve role name client-side via roles API */}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                      <td>
                        <i className="fas fa-edit user-edit" aria-hidden style={{ cursor: 'pointer' }} onClick={() => history.push(`/users/${u._id}/edit`)} />
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>Mostrando {items.length} de {total}</div>
          <div>
            <IonButton onClick={prev} disabled={page<=1}>Anterior</IonButton>
            <span style={{ margin: '0 8px' }}>Página {page}</span>
            <IonButton onClick={next} disabled={page*limit >= total}>Siguiente</IonButton>
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default UsersList;
