import { IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonDatetime, IonButtons } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

type DatetimeModalProps = {
    open: boolean;
    field: any;
    values: Record<string, any>;
    setValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    uid: string;
    setOpen: (open: boolean) => void;
}

export const DatetimeModal = ({open, field, values, setValues, uid, setOpen}: DatetimeModalProps) => {
  return (
    <IonModal isOpen={open} className="date-modal">
        <IonHeader className='ion-no-border'>
            <IonToolbar>
                <IonTitle>{field?.label || 'Seleccionar fecha/hora'}</IonTitle>
                <IonButtons slot={'end'} style={{ marginLeft: 'auto', marginRight: 8 }}>
                    <IonButton fill="clear" onClick={() => setOpen(false)}>
                    <IonIcon icon={closeOutline} />
                    </IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent>
            <div style={{ padding: 12 }}>
                <IonDatetime
                    presentation="date-time"
                    value={values[uid]}
                    onIonChange={e => {
                    const val = e.detail.value as string | undefined;
                    if (val) setValues(prev => ({ ...prev, [uid]: val }));
                    }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <IonButton onClick={() => setOpen(false)}>Cerrar</IonButton>
                    <IonButton onClick={() => setOpen(false)}>Aceptar</IonButton>
                </div>
            </div>
        </IonContent>
    </IonModal>
  )
}