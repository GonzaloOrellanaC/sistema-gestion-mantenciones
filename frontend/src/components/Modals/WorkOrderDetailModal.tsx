import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonIcon } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './Modal.css';
import { closeOutline } from 'ionicons/icons';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  workOrder?: any | null;
  renderEntityLabel?: (entity: any) => string;
  getAssetAvatarUrl?: (asset: any) => string | null;
};

const WorkOrderDetailModal: React.FC<Props> = ({ isOpen, onClose, loading = false, workOrder = null, renderEntityLabel, getAssetAvatarUrl }) => {
  const { t } = useTranslation();
  return (
    <IonModal className='modal-info' isOpen={isOpen} onWillPresent={() => (document.activeElement as HTMLElement | null)?.blur()} onDidDismiss={onClose}>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>{t('workOrderDetail.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? <div style={{ textAlign: 'center' }}><IonSpinner /></div> : (
          workOrder ? (
            <IonList>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.number')}</IonLabel>
                <div>{workOrder.orgSeq}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.state')}</IonLabel>
                <div>{workOrder.state}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.created')}</IonLabel>
                <div>{workOrder.dates?.created ? new Date(workOrder.dates.created).toLocaleString() : '-'}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.assigned')}</IonLabel>
                <div>{workOrder.dates?.assignedAt ? new Date(workOrder.dates.assignedAt).toLocaleString() : '-'}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.scheduledStart')}</IonLabel>
                <div>{workOrder.dates?.scheduledStart ? new Date(workOrder.dates.scheduledStart).toLocaleDateString() : '-'}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.estimatedEnd')}</IonLabel>
                <div>{workOrder.dates?.estimatedEnd ? new Date(workOrder.dates.estimatedEnd).toLocaleDateString() : '-'}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.technician')}</IonLabel>
                <div>{renderEntityLabel ? renderEntityLabel(workOrder.assignee || workOrder.assigneeId) : ''}</div>
              </IonItem>
              <IonItem>
                <IonLabel>{t('workOrderDetail.labels.asset')}</IonLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const url = getAssetAvatarUrl ? getAssetAvatarUrl(workOrder.assetId) : null;
                    if (url) return <img src={url} alt="activo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />;
                    return <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 6 }} />;
                  })()}
                  <div>{renderEntityLabel ? renderEntityLabel(workOrder.assetId) : ''}</div>
                </div>
              </IonItem>
            </IonList>
          ) : <div>No se pudo cargar la OT</div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default WorkOrderDetailModal;
