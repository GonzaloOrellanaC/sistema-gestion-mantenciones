import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel, IonToast } from '@ionic/react';
import * as suppliesApi from '../api/supplies';
import { useHistory } from 'react-router-dom';

const Supplies: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await suppliesApi.getSupplies();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando insumos' });
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
            <IonTitle>Insumos</IonTitle>
            <IonButton slot='end' onClick={() => history.push('/supplies/new')}>Crear Insumo</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginTop: 8 }}>
          <h3>Listado de Insumos guardados</h3>
          <IonList>
            {list.map(s => (
              <IonItem key={s._id || s.id}>
                <IonLabel>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <small>Cantidad: {s.quantity ?? 0}</small>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default Supplies;
