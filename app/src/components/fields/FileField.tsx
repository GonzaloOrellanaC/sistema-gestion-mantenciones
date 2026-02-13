import React, { useRef } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { FieldProps } from './types';
import { attachOutline } from 'ionicons/icons';

interface Props extends FieldProps {
  onFileSelected: (uid: string, file: File) => void;
  filesMap?: Record<string, { name: string; url?: string }>;
}

const FileField: React.FC<Props> = ({ field, uid, onFileSelected, filesMap }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      onFileSelected(uid, f);
    }
    // reset value so selecting the same file again will trigger change
    try { e.target.value = ''; } catch (err) { /* ignore */ }
  };

  return (
    <div>
      <input ref={inputRef} id={`file-input-${uid}`} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleChange} />
      <IonButton fill={'clear'} className="pill-button" onClick={handleClick}>
        <IonIcon icon={attachOutline} />
        <span className="pill-button-text">Adjuntar archivo</span>
      </IonButton>
      {filesMap?.[uid] && <div style={{ marginTop: 8 }}>{filesMap[uid].name}</div>}
    </div>
  );
};

export default FileField;
