import React from 'react';
import { IonModal, IonContent, IonFooter, IonToolbar, IonIcon } from '@ionic/react';
import AppButton from './Widgets/Button.widget';
import { useTranslation } from 'react-i18next';
import { checkmark } from 'ionicons/icons';

interface PlanLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  limits: string[];
  title?: string;
}

const PlanLimitsModal: React.FC<PlanLimitsModalProps> = ({ isOpen, onClose, limits, title }) => {
  const { t } = useTranslation();
  return (
    <IonModal style={{'--border-radius': 8}} isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ marginTop: 4 }}>{title || t('filters.plan_limits_title')}</h2>
          <ul style={{ paddingLeft: 18, lineHeight: '1.6' }}>
            {limits.map((item, idx) => (
              <li key={idx}>{item} <IonIcon icon={checkmark} style={{ marginLeft: 8, color: '#28a745' }} /></li>
            ))}
          </ul>
        </div>
      </IonContent>
      <IonFooter className='ion-no-border'>
        <IonToolbar>
          <AppButton style={{maxWidth: 100, marginRight: 16}} slot='end' expand={'block'} onClick={onClose}>{t('common.close') || 'Cerrar'}</AppButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default PlanLimitsModal;
