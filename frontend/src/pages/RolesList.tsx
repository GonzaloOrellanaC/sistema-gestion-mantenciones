import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import * as rolesApi from '../api/roles';
import type { Role, PaginationResponse } from '../api/types';
import './UsersList.css';
import { useHistory } from 'react-router';

const RolesList: React.FC = () => {
  const [items, setItems] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory()

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await rolesApi.listRoles({ page: p, limit, q: q || undefined });
      console.log('roles list res', res);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando roles' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const onSearch = () => { setPage(1); load(1); };

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

  const onDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar rol? Esta acción no se puede deshacer.')) return;
    try {
      await rolesApi.deleteRole(id);
      setToast({ show: true, message: 'Rol eliminado' });
      load(1);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Error eliminando rol' });
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>Gestión de Roles</IonTitle>
          <div className="toolbar-sub">Crea y administra roles y permisos</div>
          <IonButton slot='end' color="primary" onClick={() => {history.push(`/roles/new`)}}>Nuevo Rol</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="users-page ion-padding">

        <div className="table-container users-table">
          <table>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Permisos</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">{r.name?.[0] ?? 'R'}</div>
                      <div className="user-name">{r.name}</div>
                    </div>
                  </td>
                  <td>{r.permissions ? Object.keys(r.permissions).filter(k => r.permissions[k]).length : 0}</td>
                  <td>{(r as any).createdAt ? new Date((r as any).createdAt).toLocaleString() : ''}</td>
                  <td>
                    <i className="fas fa-edit user-edit" aria-hidden style={{ cursor: 'pointer', marginRight: 8 }} onClick={() => { history.push(`/roles/edit/${r._id}`); }}></i>
                    <i className="fas fa-trash user-edit" aria-hidden style={{ cursor: 'pointer', color: '#c00' }} onClick={() => onDelete(r._id)}></i>
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

export default RolesList;
