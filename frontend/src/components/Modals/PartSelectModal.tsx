import React, { useEffect, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonButton, IonSpinner, IonFooter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import * as partsApi from '../../api/parts';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assignedAssetIds?: string[];
  onSelect: (items: any[]) => void;
  initialSelected: string[]; // Array of part IDs that should be initially selected
};

const PartSelectModal: React.FC<Props> = ({ isOpen, onClose, assignedAssetIds = [], onSelect, initialSelected = [] }) => {
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
        if (assignedAssetIds && assignedAssetIds.length > 0) params.assetIds = assignedAssetIds.join(',');
        const res: any = await partsApi.listParts(params);
        if (!mounted) return;
        setItems(res.items || []);
      } catch (e) {
        console.warn('Failed loading parts', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen, assignedAssetIds]);

  useEffect(() => {
    const initialSelectedMap: Record<string, boolean> = {};
    initialSelected.forEach(id => {
      initialSelectedMap[id] = true;
    });
    setSelectedIds(initialSelectedMap);
  }, [initialSelected]);

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.name && it.name.toLowerCase().includes(q)) || (it.serial && String(it.serial).toLowerCase().includes(q));
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const confirm = () => {
    const selected = items.filter((it) => selectedIds[String(it._id)]);
    onSelect(selected.map((s) => ({ _id: s._id, name: s.name, serial: s.serial, qty: 1 })));
    setSelectedIds({});
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onWillPresent={() => (document.activeElement as HTMLElement | null)?.blur()} onDidDismiss={onClose}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>{t('partSelect.title')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={query} onIonChange={(e) => setQuery(e.detail.value ?? '')} placeholder={t('partSelect.searchPlaceholder')} />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}><IonSpinner name="crescent" /></div>
        ) : (
          <IonList>
            {filtered.map((it) => {
              const isSel = !!selectedIds[String(it._id)];
              return (
                <IonItem key={it._id} button onClick={() => { toggleSelect(String(it._id)); }} style={isSel ? { background: 'rgba(25,118,210,0.06)' } : undefined}>
                  <IonCheckbox style={{marginRight: 10}} slot="start" checked={isSel} onClick={(e) => { e.stopPropagation(); toggleSelect(String(it._id)); }} />
                  <IonLabel>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: '#607D8B' }}>{it.serial || (it.assetId && it.assetId.name) || ''}</div>
                  </IonLabel>
                </IonItem>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: 16, color: '#90A4AE' }}>{t('partSelect.empty')}</div>}
          </IonList>
        )}
      </IonContent>
      <IonFooter>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
          <IonButton fill="clear" onClick={() => { setSelectedIds({}); onClose(); }}>{t('common.cancel') || 'Cancelar'}</IonButton>
          <IonButton onClick={confirm} disabled={Object.keys(selectedIds).filter(k => selectedIds[k]).length === 0}>{t('common.confirm') || 'Aceptar'}</IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default PartSelectModal;
