import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast } from '@ionic/react';
import * as templatesApi from '../api/templates';
import type { Template } from '../api/types';
import { useHistory } from 'react-router-dom';
import './UsersList.css';

const TemplatesList: React.FC = () => {
  const [items, setItems] = useState<Template[]>([]);
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
      const res = await templatesApi.listTemplates({ page: p, limit, q: q || undefined });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando pautas' });
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

  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm('Eliminar pauta?')) return;
    try {
      await templatesApi.deleteTemplate(id);
      setItems((s) => s.filter((t) => t._id !== id));
      setToast({ show: true, message: 'Pauta eliminada' });
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: 'Error eliminando pauta' });
    }
  };

  return (
    <IonPage>
      <IonContent className="users-page ion-padding">
        <IonHeader className="users-header-toolbar ion-no-border">
          <IonToolbar>
            <div className="users-toolbar-left">
              <h2 className="toolbar-title">Gestión de Pautas</h2>
              <div className="toolbar-sub">Crea y administra las pautas de trabajo</div>
            </div>
            <div slot="end">
              <IonButton color="primary" onClick={() => history.push('/templates/create')}>Crear Pauta</IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        <div className="table-container users-table">
          <table>
            <thead>
              <tr>
                <th>Pauta</th>
                <th>Descripción</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">{t.name?.[0] ?? 'P'}</div>
                      <div className="user-name">{t.name}</div>
                    </div>
                  </td>
                  <td style={{ maxWidth: 360 }}>{t.description}</td>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <IonButton title="Vista previa" size="small" onClick={() => history.push(`/templates/${t._id}/preview`)}>
                        <i className="fas fa-eye" />
                      </IonButton>
                      <IonButton title="Editar" size="small" color="secondary" onClick={() => history.push(`/templates/${t._id}/edit`)}>
                        <i className="fas fa-edit" />
                      </IonButton>
                      <IonButton title="Eliminar" color="danger" size="small" onClick={() => remove(t._id)}>
                        <i className="fas fa-trash" />
                      </IonButton>
                    </div>
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

export default TemplatesList;
