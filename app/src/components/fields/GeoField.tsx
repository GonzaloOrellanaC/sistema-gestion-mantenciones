import React from 'react';
import { IonButton, IonText, IonIcon } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { FieldProps } from './types';

interface Props extends FieldProps {
  locations: Record<string, { lat: number; lon: number; alt?: number | null | undefined }>;
  setLocations?: React.Dispatch<React.SetStateAction<Record<string, { lat: number; lon: number; alt?: number | null | undefined }>>>;
}

const GeoField: React.FC<Props> = ({ uid, locations, setLocations, onFieldBlur, values, photos, filesMap, dynamicLists }) => {
  const takeGeo = () => {
    if (!navigator.geolocation) return alert('Geolocalización no disponible');
    navigator.geolocation.getCurrentPosition(pos => {
      // pos.coords.altitude can be number | null — keep null when unavailable
      const next = { ...(locations || {}), [uid]: { lat: pos.coords.latitude, lon: pos.coords.longitude, alt: pos.coords.altitude } };
      if (setLocations) setLocations(prev => ({ ...(prev || locations || {}), [uid]: { lat: pos.coords.latitude, lon: pos.coords.longitude, alt: pos.coords.altitude } }));
      if (onFieldBlur) onFieldBlur({ values: values || {}, photos: photos || {}, filesMap: filesMap || {}, dynamicLists: dynamicLists || {}, locations: next });
    }, err => alert('Error obteniendo ubicación: ' + err.message));
  };

  const loc = locations[uid];
  return (
    <div>
      <IonButton fill={'clear'} className="pill-button" onClick={takeGeo}>
        <IonIcon icon={locationOutline} />
        <span className="pill-button-text">Obtener ubicación</span>
      </IonButton>
      {loc && <IonText style={{ display: 'block', marginTop: 8 }}>{`Lat: ${loc.lat.toFixed(6)}, Lon: ${loc.lon.toFixed(6)}${loc.alt ? ', Alt: ' + loc.alt : ''}`}</IonText>}
    </div>
  );
};

export default GeoField;
