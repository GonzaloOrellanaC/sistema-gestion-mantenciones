import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { FieldProps } from './types';

const SelectField: React.FC<FieldProps> = ({ field, uid, values, setValues }) => {
  return (
    <IonSelect
      value={values?.[uid]}
      placeholder={field.placeholder}
      onIonChange={e => setValues && setValues(prev => ({ ...(prev || {}), [uid]: e.detail.value }))}
    >
      {(field.options || []).map(opt => (
        <IonSelectOption key={opt.value || opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default SelectField;
