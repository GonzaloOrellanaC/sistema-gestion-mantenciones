import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonToast } from '@ionic/react';
import { add as addIcon, create as editIcon, trash as trashIcon } from 'ionicons/icons';
import { listParts } from '../api/parts';
import api from '../api/axios';

type Part = any;

const Parts: React.FC = () => {
  const [items, setItems] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const [form, setForm] = useState<any>({ name: '', serial: '', quantity: 1, notes: '' });
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listParts();
      setItems(res.items || []);
    } catch (err) {
      console.error('load parts', err);
      setToast('Error loading parts');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { history.push('/parts/new'); };

  const openEdit = (p: Part) => { history.push(`/parts/edit/${p._id}`); };

  // Creation/edit handled on separate page (PartsEdit)

  const remove = async (p: Part) => {
    if (!confirm('Eliminar este repuesto?')) return;
    try {
      await api.delete(`/api/parts/${p._id}`);
      setToast('Part deleted');
      await load();
    } catch (err) {
      console.error('delete part', err);
      setToast('Error deleting part');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Repuestos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 12 }}>
          <IonButton onClick={openCreate}><IonIcon slot="start" icon={addIcon} /> Nuevo repuesto</IonButton>
        </div>

        <IonList>
          {items.map(p => (
            <IonItem key={p._id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name || p.serial || p._id}</div>
                <div style={{ fontSize: 12, color: '#666' }}>Cantidad: {p.quantity ?? '-'}</div>
              </div>
              <IonButton fill="clear" onClick={() => openEdit(p)}><IonIcon icon={editIcon} /></IonButton>
              <IonButton fill="clear" onClick={() => remove(p)}><IonIcon icon={trashIcon} /></IonButton>
            </IonItem>
          ))}
        </IonList>

        {/* Creation and editing moved to dedicated page: /parts/new and /parts/edit/:id */}

        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default Parts;
