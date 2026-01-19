import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { layersOutline, constructOutline, cubeOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

const Logistics: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    return false;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0px 12px' }}>
          <IonTitle>{t('nav.logistics') || 'Logística'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
            <IonRow>
                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission('verLotes')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionLots', { defaultValue: 'No tienes permiso para ver Lotes' }) });
                          return;
                        }
                        history.push('/logistics/lots');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={layersOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700 }}>{t('logistics.items.lots') || 'Lotes'}</div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission('verRepuestos')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionParts', { defaultValue: 'No tienes permiso para ver Repuestos' }) });
                          return;
                        }
                        history.push('/logistics/parts');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={constructOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700 }}>{t('logistics.items.parts') || 'Repuestos'}</div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission('verInsumos')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionSupplies', { defaultValue: 'No tienes permiso para ver Insumos' }) });
                          return;
                        }
                        history.push('/logistics/supplies');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={cubeOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700 }}>{t('logistics.items.supplies') || 'Insumos'}</div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>
            </IonRow>
        </IonGrid>
          <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default Logistics;
