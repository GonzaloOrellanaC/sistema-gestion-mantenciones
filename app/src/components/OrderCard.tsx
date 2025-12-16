import React from 'react';
import { IonCard, IonCardContent, IonBadge } from '@ionic/react';

type Order = {
  id: string;
  client: string;
  address?: string;
  status?: string;
  date?: string;
  type?: string;
};

const OrderCard: React.FC<{ order: Order; onClick?: (o: Order) => void }> = ({ order, onClick }) => {
  const badgeText = order.status === 'pending' ? 'Pendiente' : order.status === 'done' ? 'Finalizada' : 'En Curso';
  const badgeColor = order.status === 'pending' ? 'warning' : order.status === 'done' ? 'success' : 'primary';

  return (
    <IonCard className="card" onClick={() => onClick && onClick(order)}>
      <div className="card-status-line" style={{ backgroundColor: order.status === 'done' ? '#66BB6A' : '#0288D1' }} />
      <IonCardContent style={{ paddingLeft: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B0BEC5' }}>#{order.id}</div>
            <h3 style={{ margin: '4px 0', fontSize: '1.05rem', color: '#37474F' }}>{order.client}</h3>
            <div style={{ fontSize: '0.85rem', color: '#78909C' }}>{order.type}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <IonBadge color={badgeColor as any}>{badgeText}</IonBadge>
            <div style={{ fontSize: '0.85rem', color: '#90A4AE', marginTop: 8 }}>{order.date}</div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default OrderCard;
