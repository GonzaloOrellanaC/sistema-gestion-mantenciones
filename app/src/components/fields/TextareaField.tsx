import React from 'react';
import { IonTextarea } from '@ionic/react';
import { FieldProps } from './types';

const TextareaField: React.FC<FieldProps> = ({ field, uid, values, setValues }) => {
  return (
    <IonTextarea
      className="input-field"
      rows={3}
      placeholder={field.placeholder}
      value={values?.[uid] || ''}
      onIonChange={e => setValues && setValues(prev => ({ ...(prev || {}), [uid]: e.detail.value }))}
    />
  );
};

export default TextareaField;
