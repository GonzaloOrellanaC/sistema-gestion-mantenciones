import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonIcon, IonBadge } from '@ionic/react';
import { getWorkOrder } from '../api/workOrders';
import { useAuth } from '../context/AuthContext';
import { chevronBackOutline } from 'ionicons/icons';
import { useWorkOrder } from '../context/WorkOrderContext';
import { normalizeStructure } from '../utils/structure';

type MatchParams = {
  id: string;
};

const WorkOrderDetail: React.FC<RouteComponentProps<MatchParams>> = ({ match }) => {
  const { user } = useAuth();
  const { setStruct} = useWorkOrder()
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory()

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.params.id]);

  async function load() {
    setLoading(true);
    try {
      const data = await getWorkOrder(match.params.id);
      console.log('Work order data:', data);
      setOrder(data);
    } catch (err) {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot='start'>
                <IonButton onClick={() => {history.goBack()}}>
                    <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
            </IonButtons>
            <IonTitle>Detalle OT</IonTitle>
            {order && order.data && <IonBadge slot="end" 
              style={{
                '--background': order.data?.priority === 'baja' ? 'green' : order.data?.priority === 'normal' ? 'orange' : 'red',
                '--color': 'white',
                marginRight: '12px'
              }}
            >{order.data?.priority === 'baja' ? '1' : order.data?.priority === 'normal' ? '2' : '3'}</IonBadge>}
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
            {loading ? <IonSpinner /> : (
              order ? (
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h2>#{order.orgSeq} — {order.data?.title || 'Sin título'}</h2>
                      <h3>Descripción: {order.data?.description}</h3>
                      <p>Estado: {order.state}</p>
                      <p>Asignado a: {(order.assigneeId && order.assigneeId.firstName ? `${order.assigneeId.firstName} ${order.assigneeId.lastName || ''}` : '')}</p>
                    </IonLabel>
                  </IonItem>
                  <IonButton expand="block" onClick={() => {
                    setStruct(normalizeStructure(order.templateId?.structure));
                    history.push(`/work-orders/${order._id}/edit`)
                  }} style={{ margin: '1rem' }}>Ejecutar Orden</IonButton>
                </IonList>
              ) : (
                <div>No se encontró la orden</div>
              )
            )}
        </IonContent>
      </IonPage>
  );
};

export default WorkOrderDetail;
