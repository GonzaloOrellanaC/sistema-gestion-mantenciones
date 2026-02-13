import React, { useEffect, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonButton, IonSpinner, IonFooter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import * as suppliesApi from '../../api/supplies';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: any[]) => void;
  assignedAssetIds?: string[];
};

const SupplySelectModal: React.FC<Props> = ({ isOpen, onClose, onSelect, assignedAssetIds = [] }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 200 };
        // If assignedAssetIds available, pass them to API to scope supplies to selected assets
        if (assignedAssetIds && Array.isArray(assignedAssetIds) && assignedAssetIds.length > 0) {
          params.assetIds = assignedAssetIds.join(',');
        }
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
  }, [isOpen]);

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
              {filtered.map((it) => {
                const isSel = !!selectedIds[String(it._id)];
                return (
                  <IonItem key={it._id} button onClick={() => setSelectedIds((p) => ({ ...p, [String(it._id)]: !p[String(it._id)] }))} style={isSel ? { background: 'rgba(25,118,210,0.06)' } : undefined}>
                    <IonLabel>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: '#607D8B' }}>{it.sku || it.unit || ''}</div>
                    </IonLabel>
                  </IonItem>
                );
              })}
              {filtered.length === 0 && <div style={{ padding: 16, color: '#90A4AE' }}>{t('supplySelect.empty')}</div>}
            </IonList>
          </div>
        )}
      </IonContent>
      <IonFooter>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
          <IonButton fill="clear" onClick={() => { setSelectedIds({}); onClose(); }}>{t('supplySelect.cancel')}</IonButton>
          <IonButton onClick={() => {
            const selected = items.filter((it) => selectedIds[String(it._id)]).map((s) => ({ _id: s._id, name: s.name, sku: s.sku, qty: 1 }));
            onSelect(selected);
            setSelectedIds({});
            onClose();
          }} disabled={Object.keys(selectedIds).filter(k => selectedIds[k]).length === 0}>{t('supplySelect.confirm')}</IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default SupplySelectModal;
