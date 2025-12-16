import React from 'react';
import { IonItem, IonLabel, IonRadio } from '@ionic/react';
import { FieldProps } from './types';

const RadioField: React.FC<FieldProps> = ({ field, uid, values, setValues }) => {
  const current = !!values?.[uid];
  const toggle = () => setValues && setValues(prev => ({ ...(prev || {}), [uid]: current ? undefined : true }));

  return (
    <IonItem button onClick={toggle}>
      <IonLabel>{field.label}</IonLabel>
      <IonRadio slot="end" {...({ checked: current } as any)} />
    </IonItem>
  );
};

export default RadioField;
