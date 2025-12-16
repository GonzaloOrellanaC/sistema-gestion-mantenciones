import React from 'react';
import { IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { FieldProps } from './types';

const CheckboxField: React.FC<FieldProps> = ({ field, uid, values, setValues }) => {
  const checked = !!values?.[uid];
  return (
    <IonItem>
      <IonLabel>{field.label}</IonLabel>
      <IonCheckbox
        slot="end"
        checked={checked as any}
        onIonChange={e => setValues && setValues(prev => ({ ...(prev || {}), [uid]: e.detail.checked }))}
      />
    </IonItem>
  );
};

export default CheckboxField;
