import React from 'react';
import { IonInput } from '@ionic/react';
import { FieldProps } from './types';

const TextField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }: any) => {
  const handleBlur = () => {
    if (onFieldBlur) onFieldBlur({ values, photos, filesMap, dynamicLists, locations });
  };
  return (
    <IonInput
      className="input-field"
      placeholder={field.placeholder}
      value={values[uid] || ''}
      onIonChange={e => setValues((prev: any) => ({ ...prev, [uid]: e.detail.value }))}
      onIonBlur={handleBlur}
    />
  );
};

export default TextField;
