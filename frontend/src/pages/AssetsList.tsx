import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonList } from '@ionic/react';
import PurchaseCalendar from '../components/Calendar/PurchaseCalendar';
import brandsApi from '../api/brands';
import deviceModelsApi from '../api/deviceModels';
import assetTypesApi from '../api/assetTypes';
import branchesApi from '../api/branches';
import assetsApi from '../api/assets';
import type { } from '../api/types';
import { sortByName } from '../utils/sort';

const API_BASE = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');

function getAssetAvatarUrl(asset: any) {
  if (!asset) return null;
  const docs = asset.docs || [];
  if (!docs.length) return null;
  const doc = docs[0];
  const thumb = doc.meta && (doc.meta.thumbnailPath || doc.meta.thumbnail);
  const pathVal = thumb || doc.path || null;
  if (pathVal) {
    const p = pathVal.replace(/\\/g, '/');
    const idx = p.indexOf('/files/images/');
    if (idx !== -1) {
      const rel = p.substring(idx + '/files/images/'.length);
      return `${API_BASE}/images/${rel}`;
    }
    const idx2 = p.indexOf('/images/');
    if (idx2 !== -1) {
      const rel = p.substring(idx2 + '/images/'.length);
      return `${API_BASE}/images/${rel}`;
    }
  }
  if (doc.filename && asset.orgId) {
    return `${API_BASE}/images/${asset.orgId}/misc/${doc.filename}`;
  }
  return null;
}

const AssetsList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({ name: '', serial: '', brandId: '', modelId: '', typeId: '', branchId: '', createdDate: '' });
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [monthShown, setMonthShown] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [purchaseDays, setPurchaseDays] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const { t } = useTranslation();
  const debounceTimer = useRef<any>(null);

  const scheduleLoad = (nextFilters: any, delay = 500) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setPage(1);
      load({ page: 1, ...nextFilters });
    }, delay);
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const load = async (opts: any = {}) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10, ...filters, ...opts };
      // remove empty
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null || typeof params[k] === 'undefined') delete params[k]; });
      const res = await assetsApi.listAssets(params);
      const items = Array.isArray(res.items) ? res.items : [];
      setItems(sortByName(items));
      setTotal(Number(res.total) || 0);
      setPages(Number(res.pages) || 1);
    } catch (err: any) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando activos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    // load filter lists
    (async () => {
      try {
        const b = await brandsApi.listBrands({ limit: 500 });
        setBrands(b.items || []);
      } catch (e) { console.warn('failed loading brands', e); }
      try {
        const m = await deviceModelsApi.listDeviceModels({ limit: 1000 });
        setModels(m.items || []);
      } catch (e) { console.warn('failed loading models', e); }
      try {
        const t = await assetTypesApi.listAssetTypes({ limit: 200 });
        setTypes(t.items || []);
      } catch (e) { console.warn('failed loading types', e); }
      try {
        const br = await branchesApi.listBranches({ limit: 200 });
        setBranches(br.items || []);
      } catch (e) { console.warn('failed loading branches', e); }
    })();
  }, []);

  useEffect(() => {
    // load asset creation dates to mark calendar days
    (async () => {
      try {
        const ares: any = await assetsApi.listAssets({ limit: 1000 });
        const items = Array.isArray(ares) ? ares : (ares.items || []);
        const dates: Record<string, boolean> = {};
        items.forEach((it: any) => {
          if (it && it.createdAt) {
            const d = new Date(it.createdAt);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const key = `${y}-${m}-${dd}`;
              dates[key] = true;
            }
          }
        });
        setPurchaseDays(dates);
      } catch (e) { console.warn('failed loading assets dates', e); }
    })();
  }, []);

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: '0px 10px'}}>
            <IonTitle>{t('assets.title', { defaultValue: 'Activos' })}</IonTitle>
            <div style={{ color: 'var(--text-secondary)' }}>{t('assets.subtitle', { defaultValue: 'Lista de equipos y activos' })}</div>
            <div slot={'end'} style={{ display: 'flex', gap: 8 }}>
              <IonButton slot='end' onClick={() => history.push('/assets/new')}>{t('assets.buttons.create', { defaultValue: 'Crear Activo' })}</IonButton>
              <IonButton slot='end' onClick={() => history.push('/assets/upload/bulk')}>{t('assets.buttons.bulkCreate', { defaultValue: 'Carga Masiva' })}</IonButton>
            </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol sizeMd='9'>
              <div className="table-container">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('assets.headers.photo', { defaultValue: 'Foto' })}</th>
                      <th>{t('assets.headers.name', { defaultValue: 'Nombre' })}</th>
                      <th>{t('assets.headers.serial', { defaultValue: 'Serial' })}</th>
                      <th>{t('assets.headers.brand', { defaultValue: 'Marca' })}</th>
                      <th>{t('assets.headers.model', { defaultValue: 'Modelo' })}</th>
                      <th>{t('assets.headers.type', { defaultValue: 'Tipo' })}</th>
                      <th>{t('assets.headers.branch', { defaultValue: 'Sucursal' })}</th>
                      <th>{t('assets.headers.created', { defaultValue: 'Creado' })}</th>
                      <th>{t('assets.headers.actions', { defaultValue: 'Acciones' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(a => (
                      <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => history.push(`/assets/${a._id}/edit`)}>
                        <td style={{ width: 60 }}>
                          {(() => {
                            const url = getAssetAvatarUrl(a);
                            if (url) return <img src={url} alt={t('assets.photo_alt', { defaultValue: 'foto' })} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, marginRight: 12, marginBottom: 8, verticalAlign: 'middle' }} />;
                            return <div style={{ width: 48, height: 48, background: '#f0f0f0', borderRadius: 6, marginRight: 12, marginBottom: 8, display: 'inline-block', verticalAlign: 'middle' }} />;
                          })()}
                        </td>
                        <td>{a.name}</td>
                        <td>{a.serial || '-'}</td>
                        <td>{a.brandId ? (a.brandId.name || a.brandId) : '-'}</td>
                        <td>{a.modelId ? (a.modelId.name || a.modelId) : '-'}</td>
                        <td>{a.typeId ? (a.typeId.name || a.typeId) : '-'}</td>
                        <td>{a.branchId ? (a.branchId.name || a.branchId) : '-'}</td>
                        <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</td>
                        <td><IonButton size="small" fill="clear" onClick={(e:any) => { e.stopPropagation(); history.push(`/assets/${a._id}/edit`); }}>{t('assets.edit', { defaultValue: 'Editar' })}</IonButton></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <IonButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('assets.prev', { defaultValue: 'Prev' })}</IonButton>
                <div style={{ alignSelf: 'center' }}>{t('assets.pagination', { defaultValue: 'Página {{page}} / {{pages}} · Total: {{total}}', page, pages, total })}</div>
                <IonButton disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>{t('assets.next', { defaultValue: 'Next' })}</IonButton>
              </div>
            </IonCol>
            <IonCol sizeMd='3' style={{ textAlign: 'right', marginBottom: 12 }}>
              <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
                <IonList>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.name', { defaultValue: 'Nombre' })}</IonLabel>
                    <IonInput value={filters.name} onIonInput={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => { const nf = { ...f, name: val }; scheduleLoad(nf); return nf; });
                    }} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.serial', { defaultValue: 'Serial' })}</IonLabel>
                    <IonInput value={filters.serial} onIonInput={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => { const nf = { ...f, serial: val }; scheduleLoad(nf); return nf; });
                    }} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.brand', { defaultValue: 'Marca' })}</IonLabel>
                    <IonSelect value={filters.brandId} onIonChange={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => ({ ...f, brandId: val, modelId: '' }));
                      setPage(1);
                      load({ page: 1, brandId: val, modelId: '' });
                    }}>
                      <IonSelectOption value=''>--</IonSelectOption>
                      {brands.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.model', { defaultValue: 'Modelo' })}</IonLabel>
                    <IonSelect value={filters.modelId} onIonChange={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => ({ ...f, modelId: val }));
                      setPage(1);
                      load({ page: 1, modelId: val });
                    }}>
                      <IonSelectOption value=''>--</IonSelectOption>
                      {models.filter(m => !filters.brandId || (m.brandId && ((m.brandId._id||m.brandId) === filters.brandId || String(m.brandId) === filters.brandId))).map(m => <IonSelectOption key={m._id} value={m._id}>{m.name}</IonSelectOption>)}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.type', { defaultValue: 'Tipo' })}</IonLabel>
                    <IonSelect value={filters.typeId} onIonChange={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => ({ ...f, typeId: val }));
                      setPage(1);
                      load({ page: 1, typeId: val });
                    }}>
                      <IonSelectOption value=''>--</IonSelectOption>
                      {types.map(ti => <IonSelectOption key={ti._id} value={ti._id}>{ti.name}</IonSelectOption>)}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.branch', { defaultValue: 'Sucursal' })}</IonLabel>
                    <IonSelect value={filters.branchId} onIonChange={e => {
                      const val = (e.target as any).value;
                      setFilters((f:any) => ({ ...f, branchId: val }));
                      setPage(1);
                      load({ page: 1, branchId: val });
                    }}>
                      <IonSelectOption value=''>--</IonSelectOption>
                      {branches.map(br => <IonSelectOption key={br._id} value={br._id}>{br.name}</IonSelectOption>)}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel position='stacked'>{t('filters.createdDate', { defaultValue: 'Fecha creación' })}</IonLabel>
                    <div style={{ width: '100%' }}>
                      <PurchaseCalendar
                        monthShown={monthShown}
                        setMonthShown={setMonthShown}
                        purchaseDays={purchaseDays}
                        dateFilter={filters.createdDate}
                        setDateFilter={(s: string) => { setFilters((f:any) => ({ ...f, createdDate: s })); setPage(1); load({ page: 1, createdDate: s }); }}
                        i18nLanguage={undefined}
                        t={t}
                      />
                    </div>
                  </IonItem>
                  <IonItem>
                    <IonButton color='medium' expand='block' onClick={() => { setFilters({ name: '', serial: '', brandId: '', modelId: '', typeId: '', branchId: '', createdDate: '' }); setPage(1); load({ page: 1, name: undefined, serial: undefined, brandId: undefined, modelId: undefined, typeId: undefined, branchId: undefined, createdDate: undefined }); }}>{t('filters.clear', { defaultValue: 'Limpiar' })}</IonButton>
                  </IonItem>
                </IonList>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast isOpen={toast.show} message={toast.message || t('assets.error_load', { defaultValue: 'Error cargando activos' })} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default AssetsList;
