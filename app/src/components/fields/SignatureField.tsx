import React from 'react';
import { IonButton } from '@ionic/react';
import { FieldProps } from './types';
import './signature-field.css';

interface Props extends FieldProps {
  openSignature: (uid: string) => void;
}

const SignatureField: React.FC<Props> = ({ uid, values, openSignature }) => {
  const sig = values && values[uid];
  return (
    <div>
      <div className="signature-area" style={{ width: '100%', height: 120, borderRadius: 8, border: '1px dashed #ECEFF1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sig ? (
          <img src={sig} alt="signature" className="signature-img" />
        ) : (
          <div className="signature-placeholder">Agregar Firma</div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <IonButton fill={'clear'} className="pill-button" onClick={() => openSignature(uid)}>
          <span className="pill-button-text">Firmar</span>
        </IonButton>
      </div>
    </div>
  );
};

export default SignatureField;
