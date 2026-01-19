import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast } from '@ionic/react';
import costsApi from '../api/costs';
import { useAuth } from '../context/AuthContext';

const WorkOrdersCosts: React.FC<{ workOrderId: string }> = ({ workOrderId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState<'labor'|'part'|'service'|'other'>('labor');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useAuth();

  async function load() {
    try {
      const res = await costsApi.listByWorkOrder(workOrderId, { orgId: user?.orgId });
      setItems(res || []);
    } catch (e) { console.warn(e); }
  }

  useEffect(() => { load(); }, [workOrderId]);

  const add = async () => {
    try {
      await costsApi.add({ orgId: user?.orgId, workOrderId, type, amount, description });
      setAmount(0); setDescription('');
      setToast('Costo agregado');
      await load();
    } catch (e) { setToast('Error agregando costo'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <IonSelect value={type} onIonChange={e => setType(e.detail.value)}>
          <IonSelectOption value="labor">Mano de obra</IonSelectOption>
          <IonSelectOption value="part">Repuesto</IonSelectOption>
          <IonSelectOption value="service">Servicio</IonSelectOption>
          <IonSelectOption value="other">Otro</IonSelectOption>
        </IonSelect>
        <IonInput type="number" value={String(amount)} onIonChange={e => setAmount(Number(e.detail.value || 0))} placeholder="Monto" />
        <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} placeholder="Descripción" />
        <IonButton onClick={add}>Agregar costo</IonButton>
      </div>
      <IonList>
        {items.map(i => (
          <IonItem key={i._id}><IonLabel>{i.type} — {i.amount} {i.currency || ''} — {i.description}</IonLabel></IonItem>
        ))}
      </IonList>
      <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
    </div>
  );
};

export default WorkOrdersCosts;
