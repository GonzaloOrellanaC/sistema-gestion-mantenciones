import React, { useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons } from '@ionic/react';
import { trashOutline, cloudDownloadOutline, saveOutline, close } from 'ionicons/icons';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

const SignatureModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // ensure canvas internal size matches rendered size and draw using internal pixel coords
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      // set internal resolution
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      // reset transform (we will draw using internal pixels)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // clear and set white background using internal pixel dims
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2 * ratio;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isOpen]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if (e instanceof TouchEvent) {
      const t = e.touches[0];
      clientX = t.clientX; clientY = t.clientY;
    } else {
      const m = e as MouseEvent;
      clientX = m.clientX; clientY = m.clientY;
    }
    // Map client coordinates to canvas internal pixel coordinates
    const xCss = clientX - rect.left;
    const yCss = clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = xCss * scaleX;
    const y = yCss * scaleY;
    return { x, y };
  };

  const start = (e: any) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const p = getPos(e.nativeEvent, canvas);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    e.preventDefault();
  };

  const move = (e: any) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const p = getPos(e.nativeEvent, canvas);
    ctx.lineTo(p.x, p.y); ctx.stroke();
    e.preventDefault();
  };

  const end = (e: any) => { drawing.current = false; e.preventDefault(); };

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    // clear using internal pixel dims
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `signature-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <IonModal isOpen={isOpen} className="signature-modal">
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Firmar</IonTitle>
          <IonButtons slot='end'>
            <IonButton onClick={onClose} fill="clear">
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 12 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 300, border: '1px solid #ECEFF1', borderRadius: 8, touchAction: 'none', background: '#fff' }}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <IonButton onClick={clear} fill="clear">
              <IonIcon slot="icon-only" icon={trashOutline} />
            </IonButton>
            <IonButton onClick={download} fill="clear">
              <IonIcon slot="icon-only" icon={cloudDownloadOutline} />
            </IonButton>
            <IonButton onClick={save} fill="clear">
              <IonIcon slot="icon-only" icon={saveOutline} />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SignatureModal;
