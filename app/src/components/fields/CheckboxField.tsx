import React from 'react';
import { IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { FieldProps } from './types';

const CheckboxField: React.FC<FieldProps> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const checked = !!values?.[uid];
  return (
    <IonItem>
      <IonLabel>{field.label}</IonLabel>
      <IonCheckbox
        slot="end"
        checked={checked as any}
        onIonChange={e => {
          const v = e.detail.checked;
          if (setValues) setValues(prev => ({ ...(prev || {}), [uid]: v }));
          if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [uid]: v }, photos, filesMap, dynamicLists, locations });
        }}
      />
    </IonItem>
  );
};

export default CheckboxField;
