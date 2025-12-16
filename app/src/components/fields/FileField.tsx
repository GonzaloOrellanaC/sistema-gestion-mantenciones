import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { FieldProps } from './types';
import { attachOutline } from 'ionicons/icons';

interface Props extends FieldProps {
  onFileSelected: (uid: string, file: File) => void;
  filesMap?: Record<string, { name: string; url?: string }>;
}

const FileField: React.FC<Props> = ({ field, uid, onFileSelected, filesMap }) => {
  return (
    <div>
      <label>
        <input id={`file-input-${uid}`} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(uid, f); }} />
        <IonButton fill={'clear'} className="pill-button" onClick={() => (document.getElementById(`file-input-${uid}`) as HTMLInputElement | null)?.click()}>
          <IonIcon icon={attachOutline} />
          <span className="pill-button-text">Adjuntar archivo</span>
        </IonButton>
      </label>
      {filesMap?.[uid] && <div style={{ marginTop: 8 }}>{filesMap[uid].name}</div>}
    </div>
  );
};

export default FileField;
