import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonGrid, IonRow, IonCol, IonToast, IonSelect, IonSelectOption } from '@ionic/react';
import api from '../api/axios';
import { useStylingContext } from '../context/StylingContext';

type Params = { id: string };

const LotEdit: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();
  const { t } = useTranslation();
  const { buttonCancel } = useStylingContext();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ code: '', supplier: '', purchaseDate: '', price: undefined, notes: '', type: 'insumos' });
  const [primaryItem, setPrimaryItem] = useState<any>({ itemId: '', itemName: '', quantity: 1, unitPrice: undefined });
  const [typePurchases, setTypePurchases] = useState<Array<{ _id: string; label: string, type: string }>>([]);

  useEffect(() => {console.log({form})}, [form]);
  const currency = useMemo(() => {
    try { return (localStorage.getItem('appCurrency') || 'CLP'); } catch { return 'CLP'; }
  }, []);

  function formatCurrency(value?: number | null) {
    if (value == null) return '';
    const curr = currency || 'CLP';
    const locale = curr === 'USD' ? 'en-US' : 'es-CL';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(value);
    } catch (e) {
      return String(value) + ' ' + curr;
    }
  }

  function formatInputValue(value?: number | null) {
    if (value == null) return '';
    const curr = currency || 'CLP';
    const locale = curr === 'USD' ? 'en-US' : 'es-CL';
    try {
      const parts = new Intl.NumberFormat(locale, { maximumFractionDigits: curr === 'USD' ? 2 : 0 }).format(value);
      return parts;
    } catch (e) {
      return String(value);
    }
  }

  function parseInputValue(input: string): number | undefined {
    if (!input) return undefined;
    const curr = currency || 'CLP';
    let s = input.replace(/[^0-9,\.]/g, '').trim();
    if (curr === 'CLP') {
      s = s.replace(/\./g, '').replace(/,/g, '');
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : undefined;
    } else {
      s = s.replace(/,/g, '');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : undefined;
    }
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/lots/${id}`);
        setForm({
          code: data.code || '',
          supplier: data.supplier || '',
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().slice(0,10) : '',
          price: data.price == null ? undefined : data.price,
          notes: data.meta?.notes || '',
          type: data.type ? data.type._id : ''
        });
        if (Array.isArray(data.items) && data.items.length > 0) {
          const it = data.items[0];
          setPrimaryItem({ itemId: it.itemId || it._id || '', itemName: it.itemName || '', quantity: it.quantity || 1, unitPrice: it.unitPrice });
        }
        // load TypePurchase options
        try {
          const tpRes = await api.get('/api/type-purchases');
          if (tpRes && Array.isArray(tpRes.data?.items)) {
            setTypePurchases(tpRes.data.items.map((x: any) => ({ _id: x._id, label: x.label || x.type, type: x.type })));
          }
        } catch (e) {
          // non-fatal
        }
      } catch (err) {
        console.error('load lot', err);
        setToast(t('lotsEdit.loadError') || 'Error loading lot');
      } finally { setLoading(false); }
    })();
  }, [id, t]);

  // also load type purchases on mount (for new lots)
  useEffect(() => {
    (async () => {
      try {
        const tpRes = await api.get('/api/type-purchases');
        if (tpRes && Array.isArray(tpRes.data?.items)) {
          setTypePurchases(tpRes.data.items.map((x: any) => ({ _id: x._id, label: x.label || x.type, type: x.type })));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const payload: any = { ...form };
      // convert purchaseDate to ISO
      if (payload.purchaseDate) payload.purchaseDate = new Date(payload.purchaseDate).toISOString();
      // if primaryItem specified, include items array
      if (primaryItem && primaryItem.itemId) {
        const it: any = { itemId: primaryItem.itemId };
        if (primaryItem.quantity) it.quantity = Number(primaryItem.quantity);
        if (primaryItem.unitPrice !== undefined) it.unitPrice = Number(primaryItem.unitPrice);
        payload.items = [it];
      }
      await api.put(`/api/lots/${id}`, payload);
      setToast(t('lotsEdit.saved') || 'Lot saved');
      setTimeout(() => history.push('/lots'), 600);
    } catch (err) {
      console.error('save lot', err);
      setToast(t('lotsEdit.saveError') || 'Error saving lot');
    } finally { setLoading(false); }
  };

  const remove = async () => {
    if (!confirm(t('lotsEdit.deleteConfirm') || 'Delete this lot?')) return;
    try {
      setLoading(true);
      await api.delete(`/api/lots/${id}`);
      setToast(t('lotsEdit.deleted') || 'Lot deleted');
      setTimeout(() => history.push('/lots'), 600);
    } catch (err) {
      console.error('delete lot', err);
      setToast(t('lotsEdit.deleteError') || 'Error deleting lot');
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0px 10px' }}>
          <IonTitle>{t('lotsEdit.title') || 'Edit Lot'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.code') || 'Code'}</IonLabel>
                <IonInput value={form.code} onIonChange={e => setForm({ ...form, code: e.detail.value })} />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.supplier') || 'Supplier'}</IonLabel>
                <IonInput value={form.supplier} onIonChange={e => setForm({ ...form, supplier: e.detail.value })} />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.type') || 'Type'}</IonLabel>
                <IonSelect value={form.type} interface="popover" onIonChange={e => setForm({ ...form, type: e.detail.value })}>
                  {typePurchases.length ? typePurchases.map(tp => (
                    <IonSelectOption key={tp._id} value={tp._id}>{tp.label}</IonSelectOption>
                  )) : (
                    <>
                      <IonSelectOption value="insumos">{t('lotsEdit.types.supply') || 'Insumo'}</IonSelectOption>
                      <IonSelectOption value="repuestos">{t('lotsEdit.types.repuesto') || 'Repuesto'}</IonSelectOption>
                    </>
                  )}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.purchaseDate') || 'Purchase date'}</IonLabel>
                <IonInput type="date" value={form.purchaseDate} onIonChange={e => setForm({ ...form, purchaseDate: e.detail.value })} />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.price') || 'Price'}</IonLabel>
                <IonInput
                  type="text"
                  value={formatInputValue(form.price)}
                  onIonChange={e => {
                    const raw = e.detail.value ?? '';
                    const parsed = parseInputValue(String(raw));
                    setForm({ ...form, price: parsed });
                  }}
                  inputmode={currency === 'USD' ? 'decimal' : 'numeric'}
                />
                {form.price != null && (
                  <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{formatCurrency(form.price)}</div>
                )}
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.notes') || 'Notes'}</IonLabel>
                <IonInput value={form.notes} onIonChange={e => setForm({ ...form, notes: e.detail.value })} />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.primaryItemId') || 'Primary item'}</IonLabel>
                <IonInput value={primaryItem.itemName || primaryItem.itemId} onIonChange={e => setPrimaryItem({ ...primaryItem, itemId: String(e.detail.value || '') })} placeholder={t('lotsEdit.placeholders.itemId') || ''} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.primaryItemQuantity') || 'Quantity'}</IonLabel>
                <IonInput type="number" value={primaryItem.quantity} onIonChange={e => setPrimaryItem({ ...primaryItem, quantity: Number(e.detail.value || 1) })} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('lotsEdit.labels.primaryItemUnitPrice') || 'Unit price'}</IonLabel>
                <IonInput
                  type="text"
                  value={formatInputValue(primaryItem.unitPrice)}
                  onIonChange={e => {
                    const raw = e.detail.value ?? '';
                    const parsed = parseInputValue(String(raw));
                    setPrimaryItem({ ...primaryItem, unitPrice: parsed });
                  }}
                  inputmode={currency === 'USD' ? 'decimal' : 'numeric'}
                />
              </IonItem>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <IonButton style={buttonCancel} onClick={() => history.push('/lots')}>{t('common.cancel') || 'Cancelar'}</IonButton>
                <IonButton onClick={save} disabled={loading}>{t('common.save') || 'Guardar'}</IonButton>
                <IonButton color="danger" fill="clear" onClick={remove} disabled={loading}>{t('lotsEdit.delete') || 'Eliminar'}</IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default LotEdit;
