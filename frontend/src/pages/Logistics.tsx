import React, { useState } from 'react';
import { IonButton, IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon, IonToast, IonPopover, IonModal, IonFooter } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { layersOutline, constructOutline, cubeOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permisions';

const Logistics: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [showHelp, setShowHelp] = useState(false);


  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0px 12px' }}>
          <IonTitle>{t('logistics.menuTitle') || 'Logística'}</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => setShowHelp(true)}>
            <IonIcon icon={helpCircleOutline} style={{ fontSize: 24 }} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
            <IonRow>
                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission(permissions, 'verLotes')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionLots', { defaultValue: 'No tienes permiso para ver Lotes' }) });
                          return;
                        }
                        history.push('/logistics/lots');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={layersOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700, textAlign: 'center', width: '100%' }}>
                              {t('logistics.items.lots') || 'Lotes'}
                            </div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission(permissions, 'verRepuestos')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionParts', { defaultValue: 'No tienes permiso para ver Repuestos' }) });
                          return;
                        }
                        history.push('/logistics/parts');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={constructOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700, textAlign: 'center', width: '100%' }}>
                              {t('logistics.items.parts') || 'Repuestos'}
                            </div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="4" className="ion-padding">
                    <IonCard button onClick={() => {
                        if (!hasPermission(permissions, 'verInsumos')) {
                          setToast({ show: true, message: t('logistics.toasts.noPermissionSupplies', { defaultValue: 'No tienes permiso para ver Insumos' }) });
                          return;
                        }
                        history.push('/logistics/supplies');
                      }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <IonCardContent>
                            <IonIcon icon={cubeOutline} style={{ fontSize: 44, color: 'var(--ion-color-primary)' }} />
                            <div style={{ marginTop: 10, fontWeight: 700, textAlign: 'center', width: '100%' }}>
                              {t('logistics.items.supplies') || 'Insumos'}
                            </div>
                        </IonCardContent>
                    </IonCard>
                </IonCol>
            </IonRow>
        </IonGrid>
        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
        <IonModal isOpen={showHelp} onDidDismiss={() => setShowHelp(false)}>
          <IonContent className='ion-padding'>
            <h2>{t('logistics.help.title') || '¿Qué significan estos conceptos?'}</h2>
            <div style={{ marginBottom: 18 }}>
              <strong>{t('logistics.items.lots') || 'Lotes'}:</strong>
              <span style={{ marginLeft: 8 }}>{t('logistics.help.lots') || 'Los lotes representan los contenedores o envíos que llegan desde el proveedor, en los cuales se incluyen uno o varios repuestos o insumos en cantidades variables. Permiten rastrear el origen, la fecha de ingreso y la composición de cada recepción.'}</span>
            </div>
            <div style={{ marginBottom: 18 }}>
              <strong>{t('logistics.items.parts') || 'Repuestos'}:</strong>
              <span style={{ marginLeft: 8 }}>{t('logistics.help.parts') || 'Los repuestos son piezas o componentes que se reemplazan en los activos para restaurar su funcionamiento o prolongar su vida útil. Su gestión permite asegurar la disponibilidad y trazabilidad de las partes críticas.'}</span>
            </div>
            <div style={{ marginBottom: 18 }}>
              <strong>{t('logistics.items.supplies') || 'Insumos'}:</strong>
              <span style={{ marginLeft: 8 }}>{t('logistics.help.supplies') || 'Los insumos son artículos auxiliares utilizados para ejecutar las órdenes de trabajo. En su mayoría son desechables y permiten realizar tareas de mantenimiento, limpieza o reparación de manera eficiente.'}</span>
            </div>
          </IonContent>
          <IonFooter className='ion-padding ion-no-border'>
            <IonButton expand="block" onClick={() => setShowHelp(false)}>{t('common.close') || 'Cerrar'}</IonButton>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Logistics;
