import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { getWorkOrder } from '../api/workOrders';
import { getTemplate } from '../api/templates';
import FormRenderer from '../components/FormRenderer';
import { useWorkOrder } from '../context/WorkOrderContext';
import { chevronBackOutline } from 'ionicons/icons';

type RouteParams = {
  id: string;
};

const WorkOrderEdit: React.FC = () => {
  const { struct } = useWorkOrder();
    const history = useHistory()
  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
            <IonButtons slot='start'>
                <IonButton fill={'clear'} onClick={() => { history.goBack() }}>
                    <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
            </IonButtons>
            <IonTitle>Orden</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {
            struct ? (
                <FormRenderer schema={struct.components} />
            ) : (
                <div style={{ padding: 16 }}><IonSpinner /></div>
            )
        }
      </IonContent>
    </IonPage>
  );
};

export default WorkOrderEdit;
