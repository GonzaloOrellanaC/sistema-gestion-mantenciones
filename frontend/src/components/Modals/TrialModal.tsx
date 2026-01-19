import React from 'react';
import { IonModal, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isPaid: boolean;
  trialEnds?: Date | null;
  daysLeft?: number | null;
};

const TrialModal: React.FC<Props> = ({ isOpen, onClose, isPaid, trialEnds = null, daysLeft = null }) => {
  const { t } = useTranslation();
  return (
    <IonModal isOpen={isOpen} onWillPresent={() => (document.activeElement as HTMLElement | null)?.blur()} onDidDismiss={onClose}>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('trial.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ marginBottom: 8 }}>
            {t('trial.status')}: <strong>{isPaid ? t('trial.paid') : t('trial.inTrial')}</strong>
          </div>
          {!isPaid && trialEnds && (
            <div style={{ marginBottom: 8 }}>
              {t('trial.renewalDate')}: <strong>{trialEnds.toLocaleDateString()}</strong>
            </div>
          )}
          {!isPaid && daysLeft !== null && (
            <div style={{ marginBottom: 12 }}>
              {t('trial.daysLeft')}: <strong>{daysLeft}</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <IonButton onClick={onClose}>{t('common.close')}</IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </IonModal>
  );
};

export default TrialModal;
