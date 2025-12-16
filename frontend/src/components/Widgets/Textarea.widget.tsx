// crea un componente similar a Input.widget.tsx pero que renderice un textarea en lugar de un input
import React from 'react';
import { IonTextarea, IonItem, IonLabel } from '@ionic/react';
import type { TextareaProps } from '../../types/widgets';
import { WidgetContainer } from './WidgetContainer.widget';

export const Textarea: React.FC<TextareaProps> = ({ label, value, onChange, placeholder, disabled, rows, style, readOnly }) => {
  return (
    <WidgetContainer>
        <IonItem>
            {label && <IonLabel position="stacked">{label}</IonLabel>}
            <IonTextarea
              value={value}
              onIonChange={e => onChange && onChange(e.detail.value!)}
              placeholder={placeholder}
              disabled={disabled}
              readonly={readOnly}
              rows={rows}
              style={style}
            />
        </IonItem>
    </WidgetContainer>
  );
};