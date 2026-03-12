import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle, IonIcon, IonModal, IonList, IonItem } from '@ionic/react';
import { eyeOutline, createOutline, trashOutline } from 'ionicons/icons';
import * as templatesApi from '../api/templates';
import * as templateTypesApi from '../api/templateTypes';
import type { Template } from '../api/types';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './UsersList.css';
import { hasPermission } from '../utils/permisions';

const TemplatesList: React.FC = () => {
  const getInitial = (name?: string, fallback = 'P') => {
    if (!name) return fallback;
    const n = String(name).trim();
    return (n.charAt(0) || fallback).toUpperCase();
  };
  const [items, setItems] = useState<Template[]>([]);
  const [templateTypes, setTemplateTypes] = useState<any[]>([]);
  const [assetsModalOpen, setAssetsModalOpen] = useState(false);
  const [modalAssets, setModalAssets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const { t } = useTranslation();
  const { permissions } = useAuth();

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

  useEffect(() => {
    console.log('templates items changed', items);
  }, [items])

  // Debug: observe runtime mutations that affect avatar text (temporary)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const selector = '.user-avatar-sm, .avatar-initial';
    const onMutations = (mutations: MutationRecord[]) => {
      for (const m of mutations) {
        const target = m.target as HTMLElement;
        try {
          const found = target.closest ? target.closest('.user-avatar-sm') : null;
          const isAvatar = (target && (target.classList && (target.classList.contains('user-avatar-sm') || target.classList.contains('avatar-initial')))) || !!found;
          if (!isAvatar) continue;
          console.group('Avatar mutation detected');
          console.log('mutation type:', m.type);
          console.log('target outerHTML:', target && (target.outerHTML || target.nodeValue));
          const avatarEl = (found || (target.classList && target.classList.contains('user-avatar-sm') ? target : null)) as HTMLElement | null;
          const initialSpan = avatarEl ? avatarEl.querySelector('.avatar-initial') : (target.classList && target.classList.contains('avatar-initial') ? target as HTMLElement : null);
          console.log('avatar element:', avatarEl);
          console.log('avatar-initial textContent BEFORE:', initialSpan ? initialSpan.textContent : '(no span)');
          console.trace();
          console.groupEnd();
        } catch (err) {
          console.warn('observer error', err);
        }
      }
    };

    const observer = new MutationObserver(onMutations);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tres: any = await templateTypesApi.listTemplateTypes();
        if (!mounted) return;
        setTemplateTypes(tres.items || []);
      } catch (err) {
        console.warn('failed loading template types', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
    if (!hasPermission( permissions, 'editarPautas')) {
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
              if (!hasPermission( permissions, 'crearPautas')) {
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
                <th>Tipo</th>
                <th>Numero Activos</th>
                <th>{t('templates.headers.description')}</th>
                <th>{t('templates.headers.created')}</th>
                <th>{t('templates.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tmpl: any) => (
                <tr key={tmpl._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm" title={tmpl.name} data-name={tmpl.name}>
                        <span className="avatar-initial">{getInitial(tmpl.name, 'M')}</span>
                      </div>
                      <div className="user-name">{tmpl.name}</div>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const tt = tmpl.templateTypeId;
                      if (!tt) return <span style={{ color: '#607D8B' }}>Sin tipo</span>;
                      if (typeof tt === 'object') return tt.name || String(tt._id || tt);
                      const found = templateTypes.find(x => String(x._id) === String(tt));
                      return found ? found.name : String(tt);
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const aas: any = (tmpl as any).assignedAssets || [];
                      const arr = Array.isArray(aas) ? aas : (aas ? [aas] : []);
                      const count = arr.length;
                      if (count === 0) return <span style={{ color: '#607D8B' }}>0</span>;
                      return (
                        <a
                          onClick={() => { setModalAssets(arr); setAssetsModalOpen(true); }}
                          style={{ cursor: 'pointer', color: 'var(--ion-color-primary)', textDecoration: 'underline' }}
                        >
                          {count}
                        </a>
                      );
                    })()}
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
                          if (!hasPermission( permissions, 'editarPautas')) {
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
                          if (!hasPermission( permissions, 'editarPautas')) {
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

        <IonModal isOpen={assetsModalOpen} onDidDismiss={() => setAssetsModalOpen(false)}>
          <div style={{ padding: 16 }}>
            <h3>Activos asignados</h3>
            <div style={{ marginTop: 8 }}>
              {modalAssets && modalAssets.length > 0 ? (
                <IonList>
                  {modalAssets.map((a: any) => (
                    <IonItem key={a && (a._id || a.id) ? (a._id || a.id) : String(a)}>
                      {typeof a === 'string' ? String(a) : (a && (a.name || a._id))}
                    </IonItem>
                  ))}
                </IonList>
              ) : (
                <div style={{ color: '#607D8B' }}>No hay activos asignados.</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <IonButton onClick={() => setAssetsModalOpen(false)}>Cerrar</IonButton>
            </div>
          </div>
        </IonModal>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default TemplatesList;
