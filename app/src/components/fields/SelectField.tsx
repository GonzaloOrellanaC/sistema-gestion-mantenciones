import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { FieldProps } from './types';

const SelectField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const handleChange = (e: any) => {
    if (setValues) setValues(prev => ({ ...(prev || {}), [uid]: e.detail.value }));
    if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [uid]: e.detail.value }, photos, filesMap, dynamicLists, locations });
  };

  return (
    <IonSelect
      value={values?.[uid]}
      placeholder={field.placeholder}
      onIonChange={handleChange}
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
