import React, { useEffect, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonButton, IonSpinner } from '@ionic/react';
import * as partsApi from '../../api/parts';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assignedAssetIds?: string[];
  initialSelected?: string[];
  onSelect: (items: any[]) => void;
};

const PartSelectModal: React.FC<Props> = ({ isOpen, onClose, assignedAssetIds = [], initialSelected = [], onSelect }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

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

  // initialize selected ids when modal opens or when initialSelected changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds({});
      return;
    }
    const init: Record<string, boolean> = {};
    (initialSelected || []).forEach((id) => { if (id) init[String(id)] = true; });
    setSelectedIds(init);
  }, [isOpen, initialSelected]);

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.name && it.name.toLowerCase().includes(q)) || (it.serial && String(it.serial).toLowerCase().includes(q));
  });

  const toggleSelect = (id: string) => setSelectedIds((p) => ({ ...p, [id]: !p[id] }));
  const confirm = () => {
    const selected = items.filter((it) => selectedIds[String(it._id)]);
    onSelect(selected.map((s) => ({ _id: s._id, name: s.name, serial: s.serial, qty: 1 })));
    setSelectedIds({});
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Seleccionar repuesto</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={query} onIonChange={(e) => setQuery(e.detail.value ?? '')} placeholder="Buscar repuesto" />
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
                <IonItem key={it._id} button onClick={() => toggleSelect(String(it._id))} style={isSel ? { background: 'rgba(25,118,210,0.06)' } : undefined}>
                  <IonLabel>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: '#607D8B' }}>{it.serial || (it.assetId && it.assetId.name) || ''}</div>
                  </IonLabel>
                </IonItem>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: 16, color: '#90A4AE' }}>No hay repuestos</div>}
          </IonList>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
          <IonButton fill="clear" onClick={() => { setSelectedIds({}); onClose(); }}>Cerrar</IonButton>
          <IonButton onClick={confirm} disabled={Object.keys(selectedIds).filter(k => selectedIds[k]).length === 0}>Aceptar</IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PartSelectModal;
