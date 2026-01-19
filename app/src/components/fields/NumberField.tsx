import React from 'react';
import { IonInput } from '@ionic/react';
import { FieldProps } from './types';

const NumberField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const handleChange = (e: any) => {
    const val = e.detail.value;
    if (setValues) setValues(prev => ({ ...(prev || {}), [uid]: val }));
    if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [uid]: val }, photos, filesMap, dynamicLists, locations });
  };

  return (
    <IonInput
      type="number"
      value={values?.[uid] ?? ''}
      placeholder={field.placeholder}
      onIonChange={handleChange}
    />
  );
};

export default NumberField;
