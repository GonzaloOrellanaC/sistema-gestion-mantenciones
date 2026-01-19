import React from 'react';
import { IonItem, IonLabel, IonRadio } from '@ionic/react';
import { FieldProps } from './types';

const RadioField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const current = !!values?.[uid];
  const toggle = () => {
    const next = current ? undefined : true;
    if (setValues) setValues(prev => ({ ...(prev || {}), [uid]: next }));
    if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [uid]: next }, photos, filesMap, dynamicLists, locations });
  };

  return (
    <IonItem button onClick={toggle}>
      <IonLabel>{field.label}</IonLabel>
      <IonRadio slot="end" {...({ checked: current } as any)} />
    </IonItem>
  );
};

export default RadioField;
