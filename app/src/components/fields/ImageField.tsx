import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { cameraOutline, imagesOutline } from 'ionicons/icons';
import { FieldProps } from './types';

interface Props extends FieldProps {
  openCamera: (uid: string) => void;
  onFileSelected: (uid: string, file: File) => void;
  photos: Record<string, string>;
}

const ImageField: React.FC<Props> = ({ field, uid, photos, openCamera, onFileSelected }) => {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <IonButton fill={'outline'} size="small" onClick={() => openCamera(uid)}>
          <IonIcon slot="icon-only" icon={cameraOutline} />
        </IonButton>
        <label style={{ marginLeft: 8 }}>
          <input id={`file-input-${uid}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(uid, f); }} />
          <IonButton fill={'outline'} size="small" onClick={() => document.getElementById(`file-input-${uid}`)?.click()}>
            <IonIcon slot="icon-only" icon={imagesOutline} />
          </IonButton>
        </label>
      </div>
      {photos[uid] 
      ? 
      <img src={photos[uid]} alt="preview" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
      : 
      <div style={{ width: '100%', height: 220, borderRadius: 8, border: '1px solid #ECEFF1', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#78909C', fontWeight: 600 }}>Agregue una foto</div>
      </div>
      }
    </div>
  );
};

export default ImageField;
