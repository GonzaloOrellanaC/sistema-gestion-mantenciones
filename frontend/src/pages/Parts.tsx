import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonToast, IonCheckbox, IonPopover, IonFooter, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption } from '@ionic/react';
import { add as addIcon, chevronBackOutline, create as editIcon, trash as trashIcon, barChart as chartIcon } from 'ionicons/icons';
import ImportExcelModal from '../components/ImportExcelModal';
import { listParts } from '../api/parts';
import api from '../api/axios';
import PartUsageModal from '../components/PartUsageModal';
import * as branchesApi from '../api/branches';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { hasPermission } from '../utils/permisions';

type Part = any;

const Parts: React.FC = () => {
  const { permissions } = useAuth();
  const [items, setItems] = useState<Part[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [lowOnly, setLowOnly] = useState<boolean>(false);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { t } = useTranslation();
  const { confirm } = useNotification();
  const location = useLocation();
  const params = useParams<Record<string, string | undefined>>();
  const [form, setForm] = useState<any>({ name: '', serial: '', quantity: 1, notes: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [popoverAssets, setPopoverAssets] = useState<any[]>([]);
  const [popoverLotsOpen, setPopoverLotsOpen] = useState(false);
  const [popoverLotsEvent, setPopoverLotsEvent] = useState<any>(null);
  const [popoverLotsList, setPopoverLotsList] = useState<Array<{ _id?: string; code?: string }>>([]);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartPartId, setChartPartId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [branchesList, setBranchesList] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (lowOnly) params.lowStock = '1';
      if (filterName) params.name = filterName;
      if (filterBranch) params.branch = filterBranch;
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
  
  useEffect(() => { load(); }, [page, limit, lowOnly, filterName, filterBranch]);

  // load branches list for branch filter
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await branchesApi.listBranches({ limit: 500 });
        if (!mounted) return;
        setBranchesList(res && res.items ? res.items : []);
      } catch (e) {
        console.warn('failed loading branches for filter', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  const openChart = (p: Part) => {
    setChartPartId(p._id);
    setChartOpen(true);
  };

  // Creation/edit handled on separate page (PartsEdit)

  const remove = async (p: Part) => {
    const ok = await confirm({ message: t('partsList.toasts.deleteConfirm') });
    if (!ok) return;
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
              {hasPermission(permissions, 'crearRepuestos') && <IonButton onClick={openCreate} slot={'end'}><IonIcon slot="start" icon={addIcon} /> {t('partsList.new')}</IonButton>}
              {hasPermission(permissions, 'crearRepuestos') && <IonButton onClick={() => setShowImport(true)} slot={'end'}>{t('importModal.open', { defaultValue: 'Importar' })}</IonButton>}
            </div>
        </IonToolbar>
      </IonHeader>
      <ImportExcelModal isOpen={showImport} onDidDismiss={() => setShowImport(false)} />
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol sizeXs='12' sizeMd='9'>
              <div style={{height: '80vh', overflowY: 'auto'}}>
                <IonList>
                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr 1fr 1fr', gap: 8, padding: '8px 12px', fontSize: 12, color: '#444', fontWeight: 700 }}>
                    <div>{t('partsList.columns.name')}</div>
                    <div>{t('partsList.columns.serial')}</div>
                    <div style={{ textAlign: 'right' }}>{t('partsList.columns.min')}</div>
                    <div>{t('partsList.columns.branches') || 'Branches'}</div>
                    <div>{t('partsList.columns.assetCount') || 'Assets'}</div>
                      <div style={{ textAlign: 'center' }}>{t('partsList.columns.lowStock')}</div>
                    <div style={{ textAlign: 'right' }}>{t('partsList.columns.lotCount') || 'Lots'}</div>
                    <div style={{ textAlign: 'right' }}></div>
                  </div>

                  {items.map(p => (
                    <IonItem key={p._id}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr 1fr 1fr', gap: 8, alignItems: 'center', width: '100%' }}>
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
                        <div style={{ textAlign: 'right' }}>
                          {(() => {
                            // derive unique lot objects from inventories (populated by backend)
                            const invs = Array.isArray(p.inventories) ? p.inventories : [];
                            const map = new Map<string, { _id?: string; code?: string }>();
                            invs.forEach((inv: any) => {
                              const l = inv && inv.lotId;
                              if (l) {
                                const lid = String(l._id || l);
                                if (!map.has(lid)) map.set(lid, { _id: lid, code: l.code || '' });
                              }
                            });
                            // also include p.lotId if present
                            if (p.lotId) {
                              if (typeof p.lotId === 'string') map.set(p.lotId, { _id: p.lotId, code: '' });
                              else if (typeof p.lotId === 'object') map.set(String(p.lotId._id || ''), { _id: String(p.lotId._id || ''), code: p.lotId.code || '' });
                            }
                            const lotObjs = Array.from(map.values()).filter(x => x && x._id);
                            const count = lotObjs.length;
                            return (
                              <IonButton fill="clear" size="small" onClick={(e) => {
                                const native = (e as any).nativeEvent || e;
                                setPopoverLotsList(lotObjs);
                                setPopoverLotsEvent(native);
                                setPopoverLotsOpen(true);
                              }}>{count}</IonButton>
                            );
                          })()}
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <IonButton fill="clear" onClick={() => openChart(p)}>
                            <IonIcon icon={chartIcon} />
                          </IonButton>
                          {hasPermission(permissions, 'editarRepuestos') && <IonButton fill="clear" onClick={() => openEdit(p)}><IonIcon icon={editIcon} /></IonButton>}
                          {hasPermission(permissions, 'editarRepuestos') && <IonButton fill="clear" onClick={() => remove(p)}><IonIcon icon={trashIcon} /></IonButton>}
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            </IonCol>
            <IonCol sizeXs='12' sizeMd='3'>
              <div style={{ padding: 12, borderLeft: '1px solid #eee' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('partsList.title')}</div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12 }}>{t('partsList.columns.name')}</label>
                  <IonInput value={filterName} onIonChange={(e) => { setPage(1); setFilterName(String((e.target as any).value || '')); }} placeholder={t('partsList.columns.name') as string} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12 }}>{t('partsList.columns.branches')}</label>
                  <IonSelect value={filterBranch || ''} onIonChange={(e) => { setPage(1); setFilterBranch(String(e.detail.value || '')); }} interface="popover">
                    <IonSelectOption value="">-- {t('common.all') || 'Todos'} --</IonSelectOption>
                    {branchesList.map((b) => (
                      <IonSelectOption key={b._id || b.id} value={b._id || b.id}>{b.name || b._id || b.id}</IonSelectOption>
                    ))}
                  </IonSelect>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <IonButton color='medium' onClick={() => { setFilterName(''); setFilterBranch(''); setPage(1); }}>{t('common.clear') || 'Limpiar'}</IonButton>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>


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

        <IonPopover isOpen={popoverLotsOpen} event={popoverLotsEvent} onDidDismiss={() => setPopoverLotsOpen(false)}>
          <div style={{ padding: 12, minWidth: 200 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('partsList.popover.lots') || 'Lots'}</div>
            {popoverLotsList && popoverLotsList.length ? (
              <IonList>
                {popoverLotsList.map((l: any) => (
                  <IonItem key={String(l._id || l.code)}>{(l && (l.code || l._id)) || String(l)}</IonItem>
                ))}
              </IonList>
            ) : (
              <div style={{ color: '#666' }}>{t('partsList.popover.noLots') || 'No lots'}</div>
            )}
          </div>
        </IonPopover>

            <PartUsageModal partId={chartPartId} isOpen={chartOpen} onDidDismiss={() => { setChartOpen(false); setChartPartId(null); }} />

        {/* Creation and editing moved to dedicated page: /parts/new and /parts/edit/:id */}

        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
      <IonFooter>
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
      </IonFooter>
    </IonPage>
  );
};

export default Parts;
