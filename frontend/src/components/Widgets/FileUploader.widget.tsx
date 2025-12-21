import React, { useEffect, useRef, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';

type FileUploaderProps = {
  accept?: 'image' | 'doc' | string;
  currentUrl?: string;
  label?: string;
  maxBytes?: number;
  onSelected?: (file: File, previewUrl?: string) => void;
  onRemovePending?: () => void;
  onDeleteSaved?: () => Promise<void> | void;
};

const DEFAULT_MAX = 1 * 1024 * 1024;

export const FileUploader: React.FC<FileUploaderProps> = ({ accept = 'image', currentUrl, label, maxBytes = DEFAULT_MAX, onSelected, onRemovePending, onDeleteSaved }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createdUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [hasPending, setHasPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);
  useEffect(() => {
    return () => {
      try {
        if (createdUrlRef.current) {
          URL.revokeObjectURL(createdUrlRef.current);
          createdUrlRef.current = null;
        }
      } catch (e) { /* ignore */ }
    };
  }, []);

  const mimeTest = (file: File) => {
    if (accept === 'image') return /image\/(png|jpeg|jpg)/.test(file.type);
    if (accept === 'doc') return /(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/.test(file.type);
    if (accept) return new RegExp(accept).test(file.type);
    return true;
  };

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.size > (maxBytes || DEFAULT_MAX)) return setError('El archivo supera el tamaño máximo');
    if (!mimeTest(file)) return setError('Tipo de archivo no permitido');

    if (accept === 'image') {
      const url = URL.createObjectURL(file);
      createdUrlRef.current = url;
      const img = new Image();
      img.onload = () => {
        setPreview(url);
        setHasPending(true);
        if (onSelected) onSelected(file, url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); setError('Archivo no es una imagen válida'); };
      img.src = url;
    } else {
      // docs: no preview, just notify parent
      setPreview(null);
      setHasPending(true);
      if (onSelected) onSelected(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(f || null);
  };

  const handleDeleteClick = async () => {
    if (hasPending) {
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
      setPreview(currentUrl || null);
      setHasPending(false);
      if (onRemovePending) onRemovePending();
      return;
    }
    if (onDeleteSaved) await onDeleteSaved();
  };

  const acceptAttr = accept === 'image' ? 'image/png,image/jpeg' : (accept === 'doc' ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : accept);

  return (
    <div>
      {label && <div style={{ marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ border: '2px dashed var(--ion-color-primary)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{accept === 'image' ? 'Arrastra o selecciona una imagen' : 'Arrastra o selecciona un archivo'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tamaño máximo {(maxBytes/1024/1024).toFixed(2)} MB.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={inputRef} type="file" accept={acceptAttr} style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} />
          <IonButton onClick={() => inputRef.current?.click()}>Seleccionar</IonButton>
        </div>
      </div>
      {error && <div style={{ color: 'var(--ion-color-danger)', marginTop: 8 }}>{error}</div>}
      {accept === 'image' && preview && (
        <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
          <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 160, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
          <IonButton onClick={handleDeleteClick} color="danger" fill="clear" style={{ position: 'absolute', top: 6, right: 6 }}>
            <IonIcon icon={trashOutline} />
          </IonButton>
        </div>
      )}
      {accept !== 'image' && hasPending && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>Archivo listo para subir</div>
          <IonButton onClick={handleDeleteClick} color="danger" fill="clear"><IonIcon icon={trashOutline} /></IonButton>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
