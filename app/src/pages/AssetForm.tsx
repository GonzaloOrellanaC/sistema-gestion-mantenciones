import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonButtons, IonIcon, IonList, IonLoading } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { closeOutline } from 'ionicons/icons';
import { BrowserMultiFormatReader } from '@zxing/browser';
import ScannerArea from '../components/ScannerArea';
import ActiveFormFields from '../components/AssetFormFields';
import { axiosInstance } from '../api/axios';

type Params = { id?: string };

const ActiveForm: React.FC = () => {
  const { id } = useParams<Params>();
  const isEdit = !!id;
  const { t } = useTranslation();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const codeReaderRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (isEdit) {
      // Placeholder: load active by id when fields are provided later
      setLoading(true);
      // TODO: fetch active data from API and populate fields
      setTimeout(() => {
        // demo placeholder values
        setName('Asset example');
        setCode('ACT-001');
        setDescription('Descripción de ejemplo.');
        setBrandId(null);
        setBrandName(null);
        setModelId(null);
        setModelName(null);
        setTypeId(null);
        setTypeName(null);
        setLoading(false);
      }, 300);
    }
  }, [id, isEdit]);

  useEffect(() => {
    setScannerSupported(!!(window as any).BarcodeDetector);
    return () => {
      // On unmount, ensure scanner stopped and form cleared
      try {
        resetForm();
      } catch (e) {
        try { stopScanner(); } catch (e) {}
      }
    };
  }, []);

  async function handleSave(payload?: any) {
    setLoading(true);
    try {
      console.log('Saving payload:', payload);
      // If there are images (File objects), upload them first
      let docsIds: string[] = [];
      let imageUrls: string[] = [];
      if (payload && payload.images && Array.isArray(payload.images) && payload.images.length) {
        const uploads = await Promise.all(payload.images.map(async (file: File) => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('type', 'assets');
          const res = await axiosInstance.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          return res.data && res.data.meta ? res.data.meta : null;
        }));
        for (const u of uploads) {
          if (u) {
            if (u._id) docsIds.push(u._id);
            if (u.url) imageUrls.push(u.url);
          }
        }
      }

      const body: any = {
        name: payload?.name,
        serial: payload?.code,
        notes: payload?.description,
        brandId: payload?.brandId,
        modelId: payload?.modelId,
        typeId: payload?.typeId,
      };
      if (docsIds.length) body.docs = docsIds;
      if (imageUrls.length) body.images = imageUrls;

      console.log('Final API body:', body);
      const created = await axiosInstance.post('/assets', body);
      console.log('Asset created:', created.data);
      resetForm();
      history.push('/assets');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    try {
      stopScanner();
    } catch (e) {}
    setName('');
    setCode('');
    setDescription('');
    setBrandId(null);
    setBrandName(null);
    setModelId(null);
    setModelName(null);
    setTypeId(null);
    setTypeName(null);
  }

  async function startScanner() {
    if (scanning) return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      alert('Camera API not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      if ((window as any).BarcodeDetector) {
        const Detector = (window as any).BarcodeDetector;
        const formats = Detector.getSupportedFormats ? await Detector.getSupportedFormats() : ['qr_code', 'ean_13', 'code_128', 'code_39', 'ean_8'];
        const detector = new Detector({ formats });
        scanIntervalRef.current = window.setInterval(async () => {
          try {
            if (!videoRef.current) return;
            const w = videoRef.current.videoWidth;
            const h = videoRef.current.videoHeight;
            if (w === 0 || h === 0) return;
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            canvasRef.current.width = w;
            canvasRef.current.height = h;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoRef.current, 0, 0, w, h);
            const imageBitmap = await createImageBitmap(canvasRef.current);
            const results = await detector.detect(imageBitmap);
            if (results && results.length) {
              const raw = results[0].rawValue || results[0].raw || '';
              if (raw) {
                stopScanner();
                setCode(String(raw));
              }
            }
          } catch (err) {
            // detection may throw occasionally; ignore
          }
        }, 500);
      } else {
        // Try ZXing browser fallback if available
        try {
          const codeReader = new BrowserMultiFormatReader();
          codeReaderRef.current = codeReader;
          // Prefer to let ZXing open the stream so it can control and stop it properly.
          // If we already created a stream, extract its deviceId and stop our stream
          // before handing control to ZXing to avoid duplicate open streams.
          let deviceId: string | undefined;
          if (streamRef.current) {
            const tracks = streamRef.current.getVideoTracks();
            if (tracks && tracks.length) {
              const settings = (tracks[0] as any).getSettings?.() || {};
              deviceId = settings.deviceId || undefined;
            }
            try {
              streamRef.current.getTracks().forEach((t) => t.stop());
            } catch (e) {}
            streamRef.current = null;
            if (videoRef.current) {
              try { videoRef.current.srcObject = null; } catch (e) {}
            }
          }
          // decodeFromVideoDevice will create and manage its own MediaStream.
          codeReader.decodeFromVideoDevice(deviceId || undefined, videoRef!.current!, (result: any, err: any) => {
            if (result) {
              try {
                const text = result.getText ? result.getText() : (result && result.text) || '';
                if (text) {
                  stopScanner();
                  setCode(String(text));
                }
              } catch (e) {}
            }
          });
        }
         catch (zxErr) {
          // no fallback available; give up but keep camera preview
          console.warn('ZXing fallback not available', zxErr);
          scanIntervalRef.current = window.setInterval(() => {}, 1000);
        }
      }
    } catch (e) {
      console.error('Camera start failed', e);
      alert('No se pudo acceder a la cámara. Revisa permisos.');
    }
  }

  function stopScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {}
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setScanning(false);
  }

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <div style={{
          margin: 0,
          borderRadius: '0px 0px 20px 20px',
          padding: 18,
          background: 'var(--ion-color-primary)',
          color: 'white',
          position: 'relative',
          boxShadow: '0 6px 18px rgba(2,40,71,0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? (t('assets.edit') || 'Editar asset') : (t('assets.add') || 'Agregar asset')}</div>
              <div style={{ marginTop: 8, fontSize: 14, opacity: 0.95 }}>{isEdit ? (t('assets.edit_sub') || '') : (t('assets.add_sub') || '')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IonButtons>
                <IonButton onClick={() => {
                    resetForm();
                    history.goBack();
                }}>
                  <IonIcon icon={closeOutline} slot="start" />
                </IonButton>
              </IonButtons>
            </div>
          </div>
        </div>
      </IonHeader>
      <IonContent className="view-content">
        <div style={{ padding: 16 }}>
          <IonLoading isOpen={loading} message={t('common.saving') || 'Guardando...'} />

          <ScannerArea
            scanning={scanning}
            scannerSupported={scannerSupported}
            onStart={() => startScanner()}
            onStop={() => stopScanner()}
            videoRef={videoRef}
          />

          <ActiveFormFields
            name={name}
            setName={setName}
            code={code}
            setCode={setCode}
            description={description}
            setDescription={setDescription}
            onSave={handleSave}
            onCancel={() => { resetForm(); history.goBack(); }}
            brandId={brandId}
            setBrandId={setBrandId}
            brandName={brandName}
            setBrandName={setBrandName}
            modelId={modelId}
            setModelId={setModelId}
            modelName={modelName}
            setModelName={setModelName}
            typeId={typeId}
            setTypeId={setTypeId}
            typeName={typeName}
            setTypeName={setTypeName}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ActiveForm;
