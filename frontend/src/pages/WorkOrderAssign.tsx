import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useParams } from 'react-router-dom';

const WorkOrderAssign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <IonPage>
      <IonContent>
        <div style={{ padding: 16 }}>Asignar orden {id} (implementar formulario/selección de usuario)</div>
      </IonContent>
    </IonPage>
  );
};

export default WorkOrderAssign;
