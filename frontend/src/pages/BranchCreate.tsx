import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/react';
import * as branchesApi from '../api/branches';
import { useHistory } from 'react-router-dom';

const BranchCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();

  const handleCreate = async () => {
    if (!name) { setToast({ show: true, message: 'Nombre requerido' }); return; }
    setLoading(true);
    try {
      await branchesApi.createBranch({ name, address });
      history.push('/branches');
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando sucursal' }); }
    finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Nueva Sucursal</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 800 }}>
          <IonItem>
            <IonLabel position="stacked">Nombre</IonLabel>
            <IonInput value={name} onIonChange={e => setName(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Dirección</IonLabel>
            <IonInput value={address} onIonChange={e => setAddress(e.detail.value || '')} />
          </IonItem>
          <div style={{ marginTop: 12 }}>
            <IonButton expand="block" onClick={handleCreate} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</IonButton>
          </div>
        </div>
        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default BranchCreate;
