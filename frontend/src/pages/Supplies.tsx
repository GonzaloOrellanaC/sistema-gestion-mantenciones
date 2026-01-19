import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToast, IonBadge, IonCheckbox, IonIcon } from '@ionic/react';
import * as suppliesApi from '../api/supplies';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';

const Supplies: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [lowOnly, setLowOnly] = useState<boolean>(false);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const location = useLocation();
  const params = useParams<Record<string, string | undefined>>();
  const { t } = useTranslation();

  useEffect(() => {console.log({list})}, [list]);

  useEffect(() => { load(); }, [page, limit, lowOnly]);

  // read query params on mount / when location changes
  useEffect(() => {
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

  async function load() {
    try {
      const params: any = { page, limit };
      if (lowOnly) params.lowStock = '1';
      const data = await suppliesApi.getSupplies(params);
      const items = Array.isArray((data as any).items) ? (data as any).items : [];
      setList(items);
      setTotal(Number((data as any).total) || 0);
      setPages(Number((data as any).pages) || 1);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: t('supplies.errors.load') });
    }
  }

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: '0px 10px'}}>
            <IonButton slot="start" fill="clear" color={'dark'} onClick={() => history.goBack()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
            <IonTitle>{t('supplies.title')}</IonTitle>
            <IonButton slot='end' onClick={() => history.push('/supplies/new')}>{t('supplies.createButton')}</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginTop: 8 }}>
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.headers.name') || 'Name'}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.headers.unit') || 'Unit'}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.headers.lot') || 'Lot'}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.headers.lotRemains') || 'Per lot'}</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>{t('supplies.labels.quantity') || 'Qty'}</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>{t('supplies.labels.min') || 'Min'}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.labels.branch') || 'Branch'}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('supplies.labels.created') || 'Created'}</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>{t('lists.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => {
                  // prefer backend-provided aggregated values, otherwise fall back to computing from inventories
                  const invs: any[] = Array.isArray(s.inventories) ? s.inventories : [];
                  const qtyFromInv = invs.reduce((acc, it) => acc + (Number(it.remainingQuantity || 0)), 0);
                  const initialFromInv = invs.reduce((acc, it) => acc + (Number(it.initialQuantity || 0)), 0);
                  const qty = Number(s.quantity ?? qtyFromInv ?? 0);
                  const initialQty = Number(s.initialQuantity ?? initialFromInv ?? 0);
                  const min = typeof s.minStock === 'number' ? Number(s.minStock) : null;
                  const isLow = s.stockStatus ? (s.stockStatus === 'low' || s.stockStatus === 'out') : (min !== null && !isNaN(min) && qty <= min);
                  // derive branch names from populated `branchIds` array
                  const branchNames: string[] = Array.isArray(s.branchIds) ? s.branchIds.map((b: any) => (b.name)) : [];
                  const branchName = branchNames.length ? branchNames.join(', ') : null;
                  // derive lot codes and remaining quantities from inventories (preserve mapping)
                  const lotCodes: string[] = [];
                  const lotRemains: number[] = [];
                  // collect lot entries first (keep zeros for now)
                  const entries: Array<{ lid: string; rem: number }> = [];
                  invs.forEach(i => {
                    const rem = Number(i.remainingQuantity || 0);
                    const lid = i.lotId && typeof i.lotId === 'object' ? (i.lotId.code || i.lotId._id || i.lotId.id) : (i.lotId || i.lot || i.lote || null);
                    if (lid) entries.push({ lid: String(lid), rem });
                  });

                  // If there are multiple lots and at least one has remaining > 0,
                  // remove lots with zero remaining. If it's the only lot, keep it even if zero.
                  if (entries.length > 1 && entries.some(e => e.rem > 0)) {
                    entries.filter(e => e.rem > 0).forEach(e => { lotCodes.push(e.lid); lotRemains.push(e.rem); });
                  } else {
                    entries.forEach(e => { lotCodes.push(e.lid); lotRemains.push(e.rem); });
                  }
                  const effectiveBranch = branchName || '-';
                  return (
                    <tr key={s._id || s.id} style={{ borderTop: '1px solid #eee', cursor: 'pointer', borderLeft: isLow ? '4px solid #e34' : undefined }} onClick={() => history.push(`/logistics/supplies/${s._id || s.id}/edit`)}>
                      <td style={{ padding: '10px 12px' }}>{s.name}</td>
                      <td style={{ padding: '10px 12px' }}>{s.unit || t('supplies.unit')}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {lotCodes.length ? lotCodes.map((c, i) => (<div key={String(c) + '-' + i} style={{ whiteSpace: 'nowrap' }}>{c}</div>)) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'left' }}>
                        {lotRemains.length ? lotRemains.map((r, i) => (<div key={`r-${i}`}>{r}</div>)) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}><strong>{qty}</strong></td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{min ?? '-'}</td>
                      <td style={{ padding: '10px 12px' }}>{effectiveBranch}</td>
                      <td style={{ padding: '10px 12px' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {isLow && <IonBadge color="danger" style={{ padding: 5 }}>{t('supplies.lowStock')}</IonBadge>}
                        <div style={{ marginTop: 6 }}>
                          <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); history.push(`/logistics/supplies/${s._id || s.id}/edit`); }}>{t('lists.edit') || 'Edit'}</IonButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
      <div style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#444' }}>{t('supplies.onlyLowStock')}</label>
              <IonCheckbox checked={lowOnly} onIonChange={(e) => { setPage(1); setLowOnly(!!e.detail.checked); }} />
            <label style={{ fontSize: 13, color: '#444' }}>{t('supplies.perPage')}</label>
            <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} style={{ padding: '6px 8px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
        </div>
        <IonButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('supplies.prev')}</IonButton>
        <div style={{ alignSelf: 'center' }}>{t('supplies.pageInfo', { page, pages, total })}</div>
        <IonButton disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>{t('supplies.next')}</IonButton>
      </div>
    </IonPage>
  );
};

export default Supplies;
