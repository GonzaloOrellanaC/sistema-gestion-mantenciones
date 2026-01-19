import { IonContent, IonModal, IonSpinner } from "@ionic/react";
import './Modal.css'

export const LoadingModal = ({ isOpen, message }: { isOpen: boolean, message?: string }) => {
  return (
    <IonModal isOpen={isOpen} backdropDismiss={false} className='loading-modal'>
        <IonContent className='ion-text-center ion-padding bg-transparent'>
            <div className="content-wrapper">
            <IonSpinner name='crescent' />
            {message && <div style={{ marginTop: 16 }}>{message}</div>}

            </div>
        </IonContent>
    </IonModal>
  );
}