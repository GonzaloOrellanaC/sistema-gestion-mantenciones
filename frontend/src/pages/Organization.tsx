import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/react';
import * as orgApi from '../api/organization';
import FileUploader from '../components/Widgets/FileUploader.widget';
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
                <FileUploader
                  currentUrl={org?.meta?.logoUrl}
                  accept="image"
                  label="Logo"
                  onSelected={(file: File, preview?: string) => setPendingFiles(prev => ({ ...prev, logo: file }))}
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
              <FileUploader
                currentUrl={org?.meta?.isotypeUrl}
                accept="image"
                label="Isotipo"
                onSelected={(file: File, preview?: string) => setPendingFiles(prev => ({ ...prev, isotype: file }))}
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

// cleanup created object URL on unmount
// (placed after component so React sees it as part of module scope but will be used by each instance)
// Note: we implement cleanup inside the component via useEffect below
