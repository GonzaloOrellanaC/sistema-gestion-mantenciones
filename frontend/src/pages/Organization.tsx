import React, { useEffect, useState, useRef } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import * as orgApi from '../api/organization';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';

const MAX_BYTES = 1 * 1024 * 1024;
const LOGO_MAX = { w: 1080, h: 400 };
const ISOTYPE_MAX = { w: 600, h: 600 };

const OrganizationPage: React.FC = () => {
  const [org, setOrg] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<{ logo?: File | null; isotype?: File | null }>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const { refreshUser } = useAuth();
  const history = useHistory();

  const load = async () => {
    try {
      const data = await orgApi.getOrganization();
      setOrg(data);
    } catch (e:any) {
      console.error(e);
      setToast({ show: true, message: 'Error cargando organización' });
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      setLoading(true);
      // First upload any pending files (logo/isotype)
      const meta = { ...(org?.meta || {}) };
      if (pendingFiles.logo) {
        const res = await orgApi.uploadImage(pendingFiles.logo, 'logo');
        if (res?.url) meta.logoUrl = res.url;
        // if res.org contains full meta, use it
        if (res?.org && res.org.meta) Object.assign(meta, res.org.meta);
      }
      if (pendingFiles.isotype) {
        const res = await orgApi.uploadImage(pendingFiles.isotype, 'isotype');
        if (res?.url) meta.isotypeUrl = res.url;
        if (res?.org && res.org.meta) Object.assign(meta, res.org.meta);
      }

      // clear pending files
      setPendingFiles({});

      // send meta and name
      const updated = await orgApi.updateOrganization({ name: org?.name, meta });
      setOrg(updated);
      setToast({ show: true, message: 'Organización actualizada' });
      await refreshUser();
      history.push('/dashboard');
    } catch (e:any) {
      setToast({ show: true, message: e?.response?.data?.message || 'Error guardando' });
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>Organización</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 900 }}>
          <h3>Datos de la organización</h3>
          <IonItem>
            <IonLabel position="stacked">Nombre</IonLabel>
            <IonInput value={org?.name || ''} onIonChange={(e:any) => setOrg({ ...org, name: e.detail.value })} />
          </IonItem>

          

          <IonItem>
            <IonLabel position="stacked">Dirección</IonLabel>
            <IonInput value={org?.meta?.address || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), address: e.detail.value } })} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Contacto - Email</IonLabel>
            <IonInput value={org?.meta?.contact?.email || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), contact: { ...(org?.meta?.contact || {}), email: e.detail.value } } })} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Contacto - Teléfono</IonLabel>
            <IonInput value={org?.meta?.contact?.phone || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), contact: { ...(org?.meta?.contact || {}), phone: e.detail.value } } })} />
          </IonItem>

          <div style={{ marginTop: 16 }}>
            <h4>Logo</h4>
              <ImageUploader
                currentUrl={org?.meta?.logoUrl}
                type="logo"
                onSelected={(file: File) => setPendingFiles(prev => ({ ...prev, logo: file }))}
                onRemovePending={() => setPendingFiles(prev => ({ ...prev, logo: undefined }))}
                onDeleteSaved={async () => {
                  try {
                    const meta = { ...(org?.meta || {}) };
                    meta.logoUrl = '';
                    const updated = await orgApi.updateOrganization({ name: org?.name, meta });
                    setOrg(updated);
                    setToast({ show: true, message: 'Logo eliminado' });
                  } catch (e:any) {
                    setToast({ show: true, message: e?.response?.data?.message || 'Error eliminando logo' });
                  }
                }}
              />
          </div>

          <div style={{ marginTop: 16 }}>
            <h4>Isotipo</h4>
            <ImageUploader
              currentUrl={org?.meta?.isotypeUrl}
              type="isotype"
              onSelected={(file: File) => setPendingFiles(prev => ({ ...prev, isotype: file }))}
              onRemovePending={() => setPendingFiles(prev => ({ ...prev, isotype: undefined }))}
              onDeleteSaved={async () => {
                try {
                  const meta = { ...(org?.meta || {}) };
                  meta.isotypeUrl = '';
                  const updated = await orgApi.updateOrganization({ name: org?.name, meta });
                  setOrg(updated);
                  setToast({ show: true, message: 'Isotipo eliminado' });
                } catch (e:any) {
                  setToast({ show: true, message: e?.response?.data?.message || 'Error eliminando isotipo' });
                }
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <IonButton onClick={save} disabled={loading}>Guardar</IonButton>
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default OrganizationPage;

// Inline ImageUploader component (simple, modern drag/drop + file input + preview)
function ImageUploader({ currentUrl, type, onSelected, onDeleteSaved, onRemovePending }: { currentUrl?: string; type: 'logo' | 'isotype'; onSelected?: (file: File, previewUrl: string) => void; onDeleteSaved?: () => Promise<void>; onRemovePending?: () => void }) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createdUrlRef = useRef<string | null>(null);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);
  // cleanup created object URL on unmount
  useEffect(() => {
    return () => {
      try {
        if (createdUrlRef.current) {
          URL.revokeObjectURL(createdUrlRef.current);
          createdUrlRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const validateDims = (w: number, h: number) => {
    if (type === 'logo') return w <= LOGO_MAX.w && h <= LOGO_MAX.h;
    return w <= ISOTYPE_MAX.w && h <= ISOTYPE_MAX.h;
  };

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) return setError('El archivo supera 1MB');
    const url = URL.createObjectURL(file);
    createdUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      if (!validateDims(img.naturalWidth, img.naturalHeight)) {
        if (createdUrlRef.current) {
          URL.revokeObjectURL(createdUrlRef.current);
          createdUrlRef.current = null;
        }
        setError('Dimensiones exceden el máximo permitido');
        return;
      }
      // do not upload now — notify parent and set pending
      setPreview(url);
      setHasPending(true);
      if (onSelected) onSelected(file, url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError('Archivo no es una imagen válida'); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(f || null);
  };

  const handleDeleteClick = async () => {
    // if we have a pending file selected, remove it locally
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

    // otherwise call parent to delete saved image
    if (onDeleteSaved) {
      await onDeleteSaved();
    }
  };

  return (
    <div>
      <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ border: '2px dashed var(--ion-color-primary)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{type === 'logo' ? 'Arrastra o selecciona el logo' : 'Arrastra o selecciona el isotipo'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tamaño máximo 1MB. {type === 'logo' ? `Máx ${LOGO_MAX.w}x${LOGO_MAX.h}px` : `Máx ${ISOTYPE_MAX.w}x${ISOTYPE_MAX.h}px`}.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} />
          <IonButton onClick={() => inputRef.current?.click()}>Seleccionar</IonButton>
        </div>
      </div>
      {error && <div style={{ color: 'var(--ion-color-danger)', marginTop: 8 }}>{error}</div>}
      {preview && (
        <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
          <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 100, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
          <IonButton onClick={handleDeleteClick} color="danger" fill="clear" style={{ position: 'absolute', top: 6, right: 6 }}>
            <IonIcon icon={trashOutline} />
          </IonButton>
        </div>
      )}
    </div>
  );
}

// cleanup created object URL on unmount
// (placed after component so React sees it as part of module scope but will be used by each instance)
// Note: we implement cleanup inside the component via useEffect below
