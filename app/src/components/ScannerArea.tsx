import React from 'react';
import { IonButton, IonIcon, IonCard, IonCardContent } from '@ionic/react';
import { barcodeOutline } from 'ionicons/icons';

type Props = {
  scanning: boolean;
  scannerSupported: boolean | null;
  onStart: (e?: React.MouseEvent) => void;
  onStop: (e?: React.MouseEvent) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

const ScannerArea: React.FC<Props> = ({ scanning, scannerSupported, onStart, onStop, videoRef }) => {
  return (
    <IonCard onClick={() => { if (!scanning) onStart(); }}>
      <IonCardContent style={{ padding: 0, position: 'relative' }}>
        <div style={{ height: '200px', background: '#fff', borderRadius: 8, border: '1px solid #333', overflow: 'hidden', position: 'relative' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />

          <div style={{ position: 'absolute', right: 8, top: 8, color: '#333', fontSize: 12 }}>
            {scanning ? 'Escaneando...' : ''}
          </div>

          {scannerSupported === false && !scanning && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', opacity: 0.95 }}>
              <IonIcon icon={barcodeOutline} style={{ fontSize: 48, width: 48, height: 48, color: '#333' }} />
            </div>
          )}

          {scanning && (
            <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
              <IonButton onClick={(e) => { e.stopPropagation(); onStop(e); }}>{'Detener Escaneo'}</IonButton>
            </div>
          )}

        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ScannerArea;
