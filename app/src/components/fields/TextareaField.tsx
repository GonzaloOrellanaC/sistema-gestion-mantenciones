import React from 'react';
import { IonTextarea } from '@ionic/react';
import { FieldProps } from './types';

const TextareaField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const handleBlur = () => {
    if (onFieldBlur) onFieldBlur({ values, photos, filesMap, dynamicLists, locations });
  };
  return (
    <IonTextarea
      className="input-field"
      rows={3}
      placeholder={field.placeholder}
      value={values?.[uid] || ''}
      onIonChange={e => setValues && setValues(prev => ({ ...(prev || {}), [uid]: e.detail.value }))}
      onIonBlur={handleBlur}
    />
  );
};

export default TextareaField;
