import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonToast, IonCheckbox, IonPopover } from '@ionic/react';
import { add as addIcon, chevronBackOutline, create as editIcon, trash as trashIcon } from 'ionicons/icons';
import { listParts } from '../api/parts';
import api from '../api/axios';

type Part = any;

const Parts: React.FC = () => {
  const [items, setItems] = useState<Part[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [lowOnly, setLowOnly] = useState<boolean>(false);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<Record<string, string | undefined>>();
  const [form, setForm] = useState<any>({ name: '', serial: '', quantity: 1, notes: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [popoverAssets, setPopoverAssets] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (lowOnly) params.lowStock = '1';
      const res = await listParts(params);
      const items = Array.isArray(res.items) ? res.items : [];
      setItems(items);
      setTotal(Number(res.total) || 0);
      setPages(Number(res.pages) || 1);
    } catch (err) {
      console.error('load parts', err);
      setToast(t('partsList.toasts.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(() => {console.log({items})}, [items]);
  
  useEffect(() => { load(); }, [page, limit, lowOnly]);

  // read query params on mount / when location changes
  useEffect(() => {
    // If the route param or query key `lowStock` exists at all, enable lowOnly
    const lp = params?.lowStock;
    if (typeof lp !== 'undefined' && lp !== null) {
      setLowOnly(true);
    } else {
      const q = new URLSearchParams(location.search);
      if (q.has('lowStock')) setLowOnly(true);
      else setLowOnly(false);
    }

    const q2 = new URLSearchParams(location.search);
    const p = Number(q2.get('page') || page);
    const l = Number(q2.get('limit') || limit);
    setPage(p >= 1 ? p : 1);
    setLimit(l > 0 ? l : limit);
  }, [location.search, params?.lowStock]);

  const openCreate = () => { history.push('/logistics/parts/new'); };

  const openEdit = (p: Part) => { history.push(`/logistics/parts/edit/${p._id}`); };

  // Creation/edit handled on separate page (PartsEdit)

  const remove = async (p: Part) => {
    if (!confirm(t('partsList.toasts.deleteConfirm'))) return;
    try {
      await api.delete(`/api/parts/${p._id}`);
      setToast(t('partsList.toasts.deleted'));
      await load();
    } catch (err) {
      console.error('delete part', err);
      setToast(t('partsList.toasts.deleteError'));
    }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonButton slot="start" fill="clear" color={'dark'} onClick={() => history.goBack()}>
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <IonTitle>{t('partsList.title')}</IonTitle>
            <div slot='end' style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#444' }}>{t('partsList.lowOnly')}</label>
              <IonCheckbox checked={lowOnly} onIonChange={(e) => { setPage(1); setLowOnly(!!e.detail.checked); }} />
              <IonButton onClick={openCreate} slot={'end'}><IonIcon slot="start" icon={addIcon} /> {t('partsList.new')}</IonButton>
            </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{height: '80vh', overflowY: 'auto'}}>
          <IonList>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: 8, padding: '8px 12px', fontSize: 12, color: '#444', fontWeight: 700 }}>
              <div>{t('partsList.columns.name')}</div>
              <div>{t('partsList.columns.serial')}</div>
              <div style={{ textAlign: 'right' }}>{t('partsList.columns.min')}</div>
              <div>{t('partsList.columns.branches') || 'Branches'}</div>
              <div>{t('partsList.columns.assetCount') || 'Assets'}</div>
                <div style={{ textAlign: 'center' }}>{t('partsList.columns.lowStock')}</div>
              <div style={{ textAlign: 'right' }}></div>
            </div>

            {items.map(p => (
              <IonItem key={p._id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: 8, alignItems: 'center', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name || p.serial || p._id}</div>
                    {p.notes && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Notas: {p.notes}</div>}
                  </div>
                  <div style={{ color: '#444' }}>{p.serial ?? '-'}</div>
                    <div style={{ textAlign: 'right' }}>{p.minStock ?? '-'}</div>
                    <div style={{ color: '#444' }}>{Array.isArray(p.branchIds) && p.branchIds.length ? p.branchIds.map((b: any) => (b.name || b)).join(', ') : '-'}</div>
                  <div style={{ color: '#444' }}>
                    {(() => {
                      const n = Array.isArray(p.assetIds) ? p.assetIds.length : 0;
                      return (
                        <IonButton
                          fill="clear"
                          size="small"
                          id={`asset-btn-${p._id}`}
                          onClick={(e) => {
                            const native = (e as any).nativeEvent || e;
                            setPopoverAssets(Array.isArray(p.assetIds) ? p.assetIds : []);
                            setPopoverEvent(native);
                            setPopoverOpen(true);
                          }}
                        >
                          {n}
                        </IonButton>
                      );
                    })()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {typeof p.minStock !== 'undefined' ? (
                      (() => {
                        const qty = Number(p.quantity || 0);
                        const isLow = qty <= p.minStock;
                        return <div style={{ color: isLow ? '#b71c1c' : '#388e3c', fontWeight: 700 }}>{isLow ? t('common.yes') : t('common.no')}</div>;
                      })()
                    ) : <div style={{ color: '#777' }}>-</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <IonButton fill="clear" onClick={() => openEdit(p)}><IonIcon icon={editIcon} /></IonButton>
                    <IonButton fill="clear" onClick={() => remove(p)}><IonIcon icon={trashIcon} /></IonButton>
                  </div>
                </div>
              </IonItem>
            ))}
          </IonList>
        </div>

        <div style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 8 }}>
            <label style={{ fontSize: 13, color: '#444' }}>{t('partsList.perPage')}</label>
            <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} style={{ padding: '6px 8px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
          <IonButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('partsList.pagination.prev')}</IonButton>
          <div style={{ alignSelf: 'center' }}>{t('partsList.pageInfo', { page, pages, total })}</div>
          <IonButton disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>{t('partsList.pagination.next')}</IonButton>
        </div>

        <IonPopover isOpen={popoverOpen} event={popoverEvent} onDidDismiss={() => setPopoverOpen(false)}>
          <div style={{ padding: 12, minWidth: 200 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('partsList.popover.assets') || 'Assets'}</div>
            {popoverAssets && popoverAssets.length ? (
              <IonList>
                {popoverAssets.map((a: any) => (
                  <IonItem key={String(a._id || a)}>{(a && (a.name || a)) || String(a)}</IonItem>
                ))}
              </IonList>
            ) : (
              <div style={{ color: '#666' }}>{t('partsList.popover.noAssets') || 'No assets'}</div>
            )}
          </div>
        </IonPopover>

        {/* Creation and editing moved to dedicated page: /parts/new and /parts/edit/:id */}

        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default Parts;
