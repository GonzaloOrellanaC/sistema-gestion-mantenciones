import { IonContent, IonFab, IonFabButton, IonIcon, IonModal, IonText } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import './Modal.css';

export const ImageModal: React.FC<{
  isOpen: boolean;
  onDidDismiss: () => void;
  url: string | null;
}> = ({ isOpen, onDidDismiss, url }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} className="image-modal">
        <IonContent className="ion-text-center background-black" style={{ padding: 0 }}>
            <IonFab vertical="top" horizontal="end" slot="fixed">
                <IonFabButton size="small" color={'dark'} onClick={onDidDismiss} style={{ marginTop: 12, marginLeft: 12 }}>
                    <IonIcon icon={closeOutline} color={'light'} />
                </IonFabButton>
            </IonFab>
            {url ? (
                <div style={{ height: 'calc(100vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <img src={url} alt="Imagen ampliada" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
                </div>
            ) : (
                <div style={{ height: 'calc(100vh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonText>No hay imagen disponible</IonText>
                </div>
            )}
        </IonContent>
    </IonModal>
  );
};