// crea un componente similar a Input.widget.tsx pero que renderice un IonSelect en lugar de un input
import React from 'react';
import { IonSelect, IonSelectOption, IonItem, IonLabel } from '@ionic/react';
import type { SelectProps } from '../../types/widgets';
import { WidgetContainer } from './WidgetContainer.widget';

export const Select: React.FC<SelectProps> = ({ label, value, onChange, onInput, options, placeholder, disabled, style, readOnly }) => {
    return (
        <WidgetContainer>
            <IonItem>
                {label && <IonLabel position="stacked">{label}</IonLabel>}
                <IonSelect value={value} onIonChange={(e) => { onChange && onChange(e.detail?.value); onInput && onInput(e); }} placeholder={placeholder} disabled={disabled || readOnly} style={style}>
                    {(options || []).map((option) => (
                        <IonSelectOption key={String(option.value)} value={option.value}>
                            {option.label}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
        </WidgetContainer>
    );
};
