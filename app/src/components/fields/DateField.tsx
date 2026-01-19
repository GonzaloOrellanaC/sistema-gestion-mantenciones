import React, { useState } from 'react';
import { IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonDatetime, IonButtons } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import { FieldProps } from './types';
import { DatetimeModal } from '../../modals/DatetimeModal';

interface Props extends FieldProps {
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
}

const DateField: React.FC<Props> = ({ field, uid, values, setValues, photos, filesMap, dynamicLists, locations, onFieldBlur }) => {
  const [open, setOpen] = useState(false);
  const display = values && values[uid] ? new Date(values[uid]).toLocaleString() : '';

  // wrap setValues to also trigger onFieldBlur with snapshot
  const wrappedSetValues = (updater: any) => {
    if (typeof updater === 'function') {
      const next = updater(values || {});
      setValues(next);
      if (onFieldBlur) onFieldBlur({ values: next, photos, filesMap, dynamicLists, locations });
    } else {
      const next = { ...(values || {}), ...updater };
      setValues(next);
      if (onFieldBlur) onFieldBlur({ values: next, photos, filesMap, dynamicLists, locations });
    }
  };

  return (
    <div>
      <IonButton fill={'clear'} className="pill-button" onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonIcon icon={calendarOutline} />
        <span className="pill-button-text">{display || 'Seleccionar fecha/hora'}</span>
      </IonButton>

      {open && <DatetimeModal
        open={open}
        field={field}
        values={values}
        setValues={wrappedSetValues}
        uid={uid}
        setOpen={setOpen}
      />}

      {display && <div style={{ marginTop: 8, fontSize: 13, color: '#37474F' }}>{display}</div>}
    </div>
  );
};

export default DateField;
