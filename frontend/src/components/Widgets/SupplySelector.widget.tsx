import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonButton, IonList, IonIcon } from '@ionic/react';
import { add as addIcon, close as closeIcon } from 'ionicons/icons';
import { getSupplies } from '../../api/supplies';

type SelectedItem = { supplyId: string; name: string; quantity: number };

export const SupplySelector: React.FC<{
  branchId?: string;
  value?: SelectedItem[];
  onChange?: (items: SelectedItem[]) => void;
}> = ({ branchId, value = [], onChange }) => {
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [picked, setPicked] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [items, setItems] = useState<SelectedItem[]>(value || []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSupplies(branchId ? { branchId } : undefined);
        setItemsList(res.items || []);
      } catch (err) {
        console.error('Failed loading supplies', err);
      }
    };
    load();
  }, [branchId]);

  useEffect(() => onChange && onChange(items), [items]);

  const addItem = () => {
    if (!picked) return;
    const comp = itemsList.find((c) => String(c._id) === String(picked));
    if (!comp) return;
    const exist = items.find((i) => i.supplyId === picked);
    if (exist) {
      setItems(items.map(i => i.supplyId === picked ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setItems([...items, { supplyId: picked, name: comp.name || comp.code || 'Supply', quantity: qty }]);
    }
    setQty(1);
    setPicked('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.supplyId !== id));

  return (
    <div>
      <IonItem>
        <IonLabel position="stacked">Insumo</IonLabel>
        <IonSelect value={picked} placeholder="Seleccione insumo" onIonChange={e => setPicked(String(e.detail.value))}>
          {itemsList.map(c => (
            <IonSelectOption key={c._id} value={c._id}>{c.name || c.code || `${c._id}`}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Cantidad</IonLabel>
        <IonInput type="number" value={qty} onIonChange={e => setQty(Number(e.detail?.value ?? 1))} />
        <IonButton onClick={addItem} slot="end"><IonIcon icon={addIcon} /> Agregar</IonButton>
      </IonItem>

      <IonList>
        {items.map(it => (
          <IonItem key={it.supplyId}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted, #607D8B)' }}>Cantidad: {it.quantity}</div>
            </div>
            <IonButton fill="clear" onClick={() => removeItem(it.supplyId)}>
              <IonIcon icon={closeIcon} />
            </IonButton>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default SupplySelector;
