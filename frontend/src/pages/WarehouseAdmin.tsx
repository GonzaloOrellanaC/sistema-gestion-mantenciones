import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonList, IonToast } from '@ionic/react';
import inventoryApi from '../api/inventory';
import { useAuth } from '../context/AuthContext';

const WarehouseAdmin: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    inventoryApi.listWarehouses({ orgId: user?.orgId }).then((res: any) => { if (mounted) setWarehouses(res || []); }).catch(() => {}).finally(() => {});
    return () => { mounted = false; };
  }, [user?.orgId]);

  const create = async () => {
    if (!name) return setToast('Ingrese nombre');
    setLoading(true);
    try {
      await inventoryApi.createWarehouse({ orgId: user?.orgId, name });
      const res = await inventoryApi.listWarehouses({ orgId: user?.orgId });
      setWarehouses(res || []);
      setName('');
      setToast('Almacén creado');
    } catch (e) { setToast('Error creando almacén'); }
    setLoading(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Almacenes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <IonInput placeholder="Nombre del almacén" value={name} onIonChange={e => setName(e.detail.value || '')} />
            <IonButton onClick={create} disabled={loading}>{loading ? '...' : 'Crear'}</IonButton>
          </div>
          <IonList>
            {warehouses.map(w => (
              <IonItem key={w._id}><IonLabel>{w.name}</IonLabel></IonItem>
            ))}
          </IonList>
        </div>
        <IonToast isOpen={!!toast} message={toast || ''} onDidDismiss={() => setToast(null)} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default WarehouseAdmin;
