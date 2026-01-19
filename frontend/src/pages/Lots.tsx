import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonFooter, IonSpinner, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/react';
import { Select } from '../components/Widgets/Select.widget';
import api from '../api/axios';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './calendar.css';
import PurchaseCalendar from '../components/Calendar/PurchaseCalendar';
import { chevronBackOutline } from 'ionicons/icons';

const Lots: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [codeFilter, setCodeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthShown, setMonthShown] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [purchaseDays, setPurchaseDays] = useState<Record<string, boolean>>({});
  const { t, i18n } = useTranslation();
  const history = useHistory();
  // allow navigating to earlier months so purchase dates (in the past) are visible
  const minMonth = new Date(1970, 0, 1);

  const LIMIT = 10;

  const locale = useMemo(() => {
    const raw = t('app.locale');
    if (raw && raw !== 'app.locale') return raw;
    if (i18n && i18n.language) return i18n.language;
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
    return 'en-US';
  }, [t, i18n]);

  const currency = useMemo(() => {
    const raw = t('app.currency');
    if (raw && raw !== 'app.currency') return raw;
    return 'USD';
  }, [t]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency });
    } catch (e) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    }
  }, [locale, currency]);

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }, [locale]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { page, limit: LIMIT };
        if (supplierFilter) params.supplier = supplierFilter;
        if (typeFilter) params.type = typeFilter;
        if (codeFilter) params.code = codeFilter;
        if (dateFilter) params.purchaseDate = dateFilter;
        const res = await api.get('/api/lots', { params });
        const data = res.data;
        if (!mounted) return;
        if (Array.isArray(data)) {
          setLots(data);
          setTotal(data.length);
          setPages(1);
        } else {
          setLots(data.items || []);
          const totalRes = Number(data.total) || (Array.isArray(data.items) ? data.items.length : 0);
          setTotal(totalRes);
          const computedPages = Math.max(1, Math.ceil(totalRes / LIMIT));
          setPages(computedPages);
        }
      } catch (e) {
        // ignore for now
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page, supplierFilter, typeFilter, codeFilter, dateFilter]);

  useEffect(() => {
    let mounted = true;
    const loadSuppliersAndDates = async () => {
      try {
        const res = await api.get('/api/lots', { params: { page: 1, limit: 1000 } });
        const data = res.data;
        const items = Array.isArray(data) ? data : (data.items || []);
        const s = new Set<string>();
        const dates: Record<string, boolean> = {};
        items.forEach((l: any) => {
          if (l && l.supplier) s.add(String(l.supplier));
          if (l && l.purchaseDate) {
            const d = new Date(l.purchaseDate);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const key = `${y}-${m}-${dd}`;
              dates[key] = true;
            }
          }
        });
        if (!mounted) return;
        setSuppliers(Array.from(s).sort((a,b) => a.localeCompare(b)));
        setPurchaseDays(dates);
      } catch (e) {
        // ignore
      }
    };
    loadSuppliersAndDates();
    return () => { mounted = false; };
  }, []);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0px 12px' }}>
          <IonButton slot="start" fill="clear" color={'dark'} onClick={() => history.goBack()}>
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <IonTitle>{t('logistics.items.lots') || 'Lotes'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="10">
              <div>
                {loading && (
                  <div style={{ textAlign: 'center', padding: 12 }}><IonSpinner name="crescent" /></div>
                )}
                {!loading && (
                  <div className="table-container">
                    <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px 12px' }}>{t('lots.headers.code') || 'Code'}</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px' }}>{t('lots.headers.type') || 'Type'}</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px' }}>{t('lots.headers.branch') || 'Branch'}</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px' }}>{t('lots.headers.supplier') || 'Supplier'}</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px' }}>{t('lots.headers.purchaseDate') || 'Purchase Date'}</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px' }}>{t('lots.headers.price') || 'Price'}</th>
                          <th style={{ textAlign: 'center', padding: '8px 12px' }}>{t('lists.actions') || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lots.map(l => (
                          <tr key={l._id} style={{ borderTop: '1px solid #eee', cursor: 'pointer' }} onClick={() => history.push(`/logistics/lots/edit/${l._id}`)}>
                            <td style={{ padding: '10px 12px' }}>{l.code || l._id}</td>
                            <td style={{ padding: '10px 12px' }}>
                              {(() => {
                                // `type` may be populated object { type, label } or legacy string
                                const raw = l.type;
                                if (!raw) return t('lots.types.supply') || 'Supply';
                                if (typeof raw === 'object') {
                                  // prefer label, fall back to type code
                                  const code = raw.type || (raw.label ? raw.label.toLowerCase() : undefined);
                                  const label = raw.label || raw.type;
                                  // map code to translation when possible
                                  if (code === 'repuestos') return t('lots.types.part') || label || 'Part';
                                  if (code === 'insumos') return t('lots.types.supply') || label || 'Supply';
                                  return label;
                                }
                                // raw is string: could be 'repuestos'|'insumos' or a legacy label
                                const s = String(raw);
                                if (s === 'repuestos') return t('lots.types.part') || 'Part';
                                if (s === 'insumos') return t('lots.types.supply') || 'Supply';
                                // otherwise show as-is
                                return s;
                              })()}
                            </td>
                            <td style={{ padding: '10px 12px' }}>{(l.branchId && typeof l.branchId === 'object') ? (l.branchId.name || l.branchId._id) : (l.branchId || '-')}</td>
                            <td style={{ padding: '10px 12px', color: '#666' }}>{l.supplier || '-'}</td>
                            <td style={{ padding: '10px 12px' }}>{l.purchaseDate ? dateFormatter.format(new Date(l.purchaseDate)) : '-'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{typeof l.price === 'number' ? currencyFormatter.format(l.price) : '-'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); history.push(`/logistics/lots/edit/${l._id}`); }}>{t('lists.edit') || 'Edit'}</IonButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </IonCol>

            <IonCol size="12" size-md="2">
              <div style={{ paddingLeft: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('lists.filters') || 'Filters'}</div>
                <div style={{ marginBottom: 12 }}>
                  <Select
                    label={t('lots.filters.type') || 'Type'}
                    value={typeFilter}
                    placeholder={t('lists.filterAll') || 'All'}
                    onChange={(v: any) => { setTypeFilter(v); setPage(1); }}
                    options={[{ value: '', label: t('lists.filterAll') || 'All' }, { value: 'insumos', label: t('lots.types.supply') || 'Supply' }, { value: 'repuestos', label: t('lots.types.part') || 'Part' }]}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Select
                    label={t('lists.filterSupplier') || 'Supplier'}
                    value={supplierFilter}
                    placeholder={t('lists.filterAll') || 'All'}
                    onChange={(v: any) => { setSupplierFilter(v); setPage(1); }}
                    options={[{ value: '', label: t('lists.filterAll') || 'All' }, ...suppliers.map(s => ({ value: s, label: s }))]}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{t('lots.filters.code') || 'Code'}</div>
                  <input
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    value={codeFilter}
                    onChange={(e) => { setCodeFilter(e.target.value); setPage(1); }}
                    placeholder={t('lots.filters.codePlaceholder') || 'Search code'}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{t('lots.filters.purchaseDate') || 'Purchase Date'}</div>
                  <PurchaseCalendar
                    monthShown={monthShown}
                    setMonthShown={(d: Date) => setMonthShown(d)}
                    purchaseDays={purchaseDays}
                    dateFilter={dateFilter}
                    setDateFilter={(s: string) => { setDateFilter(s); setPage(1); }}
                    i18nLanguage={i18n.language}
                    t={t}
                    minMonth={minMonth}
                  />
                </div>
                <div>
                  <IonButton fill="outline" onClick={() => { setSupplierFilter(''); setTypeFilter(''); setCodeFilter(''); setDateFilter(''); setPage(1); }}>{t('lists.clear') || 'Clear'}</IonButton>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
        <IonFooter>
            <IonToolbar>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ paddingLeft: 12 }}>{t('lists.total') ? `${t('lists.total')}: ${total}` : `Total: ${total}`}</div>
                    <div style={{ display: 'flex', gap: 8, paddingRight: 12 }}>
                        <IonButton disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{t('lists.prev') || 'Prev'}</IonButton>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>{page} / {pages}</div>
                        <IonButton disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>{t('lists.next') || 'Next'}</IonButton>
                    </div>
                </div>
            </IonToolbar>
        </IonFooter>
    </IonPage>
  );
};

export default Lots;
