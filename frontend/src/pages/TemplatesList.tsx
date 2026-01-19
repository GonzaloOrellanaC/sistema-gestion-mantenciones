import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle, IonIcon } from '@ionic/react';
import { eyeOutline, createOutline, trashOutline } from 'ionicons/icons';
import * as templatesApi from '../api/templates';
import type { Template } from '../api/types';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
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
  const { t } = useTranslation();
  const { user } = useAuth();

  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    return false;
  };

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await templatesApi.listTemplates({ page: p, limit, q: q || undefined });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: t('templates.toasts.loadError') });
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
    if (!hasPermission('editarPautas')) {
      setToast({ show: true, message: t('templates.toasts.noPermissionDelete', { defaultValue: 'No tienes permiso para eliminar pautas' }) });
      return;
    }
    if (!confirm(t('templates.confirmDelete'))) return;
    try {
      await templatesApi.deleteTemplate(id);
      setItems((s) => s.filter((item) => item._id !== id));
      setToast({ show: true, message: t('templates.toasts.deleted') });
    } catch (err: unknown) {
      console.error(err);
      setToast({ show: true, message: t('templates.toasts.deleteError') });
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>{t('templates.title')}</IonTitle>
          <div className="toolbar-sub">{t('templates.subtitle')}</div>
          <IonButton
            slot='end'
            color="primary"
            onClick={() => {
              if (!hasPermission('crearPautas')) {
                setToast({ show: true, message: t('templates.toasts.noPermissionCreate', { defaultValue: 'No tienes permiso para crear pautas' }) });
                return;
              }
              history.push('/templates/create');
            }}
          >{t('templates.newTemplate')}</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="users-page ion-padding">

        <div className="table-container users-table">
          <table>
            <thead>
              <tr>
                <th>{t('templates.headers.name')}</th>
                <th>{t('templates.headers.description')}</th>
                <th>{t('templates.headers.created')}</th>
                <th>{t('templates.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tmpl) => (
                <tr key={tmpl._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">{tmpl.name?.[0] ?? 'P'}</div>
                      <div className="user-name">{tmpl.name}</div>
                    </div>
                  </td>
                  <td style={{ maxWidth: 360 }}>{tmpl.description}</td>
                  <td>{tmpl.createdAt ? new Date(tmpl.createdAt).toLocaleString() : ''}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <IonButton title={t('templates.actions.preview')} size="small" onClick={() => history.push(`/templates/${tmpl._id}/preview`)}>
                        <IonIcon slot="icon-only" icon={eyeOutline} />
                      </IonButton>
                      <IonButton
                        title={t('templates.actions.edit')}
                        size="small"
                        color="secondary"
                        onClick={() => {
                          if (!hasPermission('editarPautas')) {
                            setToast({ show: true, message: t('templates.toasts.noPermissionEdit', { defaultValue: 'No tienes permiso para editar pautas' }) });
                            return;
                          }
                          history.push(`/templates/${tmpl._id}/edit`);
                        }}
                      >
                        <IonIcon slot="icon-only" icon={createOutline} />
                      </IonButton>
                      <IonButton
                        title={t('templates.actions.delete')}
                        color="danger"
                        size="small"
                        onClick={() => {
                          if (!hasPermission('editarPautas')) {
                            setToast({ show: true, message: t('templates.toasts.noPermissionDelete', { defaultValue: 'No tienes permiso para eliminar pautas' }) });
                            return;
                          }
                          remove(tmpl._id);
                        }}
                      >
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>{t('templates.showing', { count: items.length, total })}</div>
          <div>
            <IonButton onClick={prev} disabled={page<=1}>{t('templates.pagination.prev')}</IonButton>
            <span style={{ margin: '0 8px' }}>{t('templates.pagination.page', { page })}</span>
            <IonButton onClick={next} disabled={page*limit >= total}>{t('templates.pagination.next')}</IonButton>
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default TemplatesList;
