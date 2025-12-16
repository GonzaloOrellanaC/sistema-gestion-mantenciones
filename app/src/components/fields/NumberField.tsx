import React from 'react';
import { IonInput } from '@ionic/react';
import { FieldProps } from './types';

const NumberField: React.FC<FieldProps> = ({ field, uid, values, setValues }) => {
  return (
    <IonInput
      type="number"
      value={values?.[uid] ?? ''}
      placeholder={field.placeholder}
      onIonChange={e => setValues && setValues(prev => ({ ...(prev || {}), [uid]: e.detail.value }))}
    />
  );
};

export default NumberField;
