import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonButton, IonList, IonIcon } from '@ionic/react';
import { add as addIcon, close as closeIcon } from 'ionicons/icons';
import { listParts } from '../../api/parts';

type SelectedItem = { partId: string; name: string; quantity: number };

export const PartSelector: React.FC<{
  branchId?: string;
  value?: SelectedItem[];
  onChange?: (items: SelectedItem[]) => void;
}> = ({ branchId, value = [], onChange }) => {
  const [parts, setParts] = useState<any[]>([]);
  const [picked, setPicked] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [items, setItems] = useState<SelectedItem[]>(value || []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listParts(branchId ? { branchId } : undefined);
        setParts(res.items || []);
      } catch (err) {
        console.error('Failed loading parts', err);
      }
    };
    load();
  }, [branchId]);

  useEffect(() => onChange && onChange(items), [items]);

  const addItem = () => {
    if (!picked) return;
    const comp = parts.find((c) => String(c._id) === String(picked));
    if (!comp) return;
    const exist = items.find((i) => i.partId === picked);
    if (exist) {
      setItems(items.map(i => i.partId === picked ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setItems([...items, { partId: picked, name: comp.name || comp.serial || 'Part', quantity: qty }]);
    }
    setQty(1);
    setPicked('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.partId !== id));

  return (
    <div>
      <IonItem>
        <IonLabel position="stacked">Part</IonLabel>
        <IonSelect value={picked} placeholder="Select part" onIonChange={e => setPicked(String(e.detail.value))}>
          {parts.map(c => (
            <IonSelectOption key={c._id} value={c._id}>{c.name || c.serial || `${c._id}`}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Quantity</IonLabel>
        <IonInput type="number" value={qty} onIonChange={e => setQty(Number(e.detail?.value ?? 1))} />
        <IonButton onClick={addItem} slot="end"><IonIcon icon={addIcon} /> Add</IonButton>
      </IonItem>

      <IonList>
        {items.map(it => (
          <IonItem key={it.partId}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted, #607D8B)' }}>Quantity: {it.quantity}</div>
            </div>
            <IonButton fill="clear" onClick={() => removeItem(it.partId)}>
              <IonIcon icon={closeIcon} />
            </IonButton>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default PartSelector;
