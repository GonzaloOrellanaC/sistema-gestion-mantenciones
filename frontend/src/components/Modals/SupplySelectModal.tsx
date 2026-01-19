import React, { useEffect, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonButton, IonSpinner, IonFooter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import * as suppliesApi from '../../api/supplies';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assignedAssetIds?: string[];
  onSelect: (item: any) => void;
};

const SupplySelectModal: React.FC<Props> = ({ isOpen, onClose, assignedAssetIds = [], onSelect }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 200 };
        if (assignedAssetIds && assignedAssetIds.length > 0) params.assetIds = assignedAssetIds.join(',');
        const res: any = await suppliesApi.getSupplies(params);
        if (!mounted) return;
        setItems(res.items || res.items || []);
      } catch (e) {
        console.warn('Failed loading supplies', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen, assignedAssetIds]);

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.name && it.name.toLowerCase().includes(q)) || (it.sku && String(it.sku).toLowerCase().includes(q));
  });

  return (
  <IonModal isOpen={isOpen} onWillPresent={() => (document.activeElement as HTMLElement | null)?.blur()} onDidDismiss={() => { setSelected(null); onClose(); }}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>{t('supplySelect.title')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={query} onIonChange={(e) => setQuery(e.detail.value ?? '')} placeholder={t('supplySelect.searchPlaceholder')} />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}><IonSpinner name="crescent" /></div>
        ) : (
          <div>
            <IonList>
              {filtered.map((it) => (
                <IonItem key={it._id} button onClick={() => { setSelected(it); }}>
                  <IonLabel>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: '#607D8B' }}>{it.sku || it.unit || ''}</div>
                  </IonLabel>
                </IonItem>
              ))}
              {filtered.length === 0 && <div style={{ padding: 16, color: '#90A4AE' }}>{t('supplySelect.empty')}</div>}
            </IonList>

            {selected && (
              <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
                <div style={{ fontWeight: 700 }}>{selected.name}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <IonButton fill="clear" onClick={() => setSelected(null)}>{t('supplySelect.cancel')}</IonButton>
                    <IonButton onClick={() => { onSelect({ ...selected }); setSelected(null); onClose(); }}>{t('supplySelect.confirm')}</IonButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </IonContent>
      <IonFooter>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
          <IonButton fill="clear" onClick={onClose}>{t('common.close')}</IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default SupplySelectModal;
