import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/react';
import * as orgApi from '../api/organization';
import FileUploader from '../components/Widgets/FileUploader.widget';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const load = async () => {
    try {
      const data = await orgApi.getOrganization();
      setOrg(data);
    } catch (e:any) {
      console.error(e);
      setToast({ show: true, message: t('organization.toasts.loadError') });
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
      setToast({ show: true, message: t('organization.toasts.updated') });
      await refreshUser();
      history.push('/dashboard');
    } catch (e:any) {
      setToast({ show: true, message: e?.response?.data?.message || t('organization.toasts.saveError') });
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>{t('organization.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 900 }}>
          <h3>{t('organization.heading')}</h3>
          <IonItem>
            <IonLabel position="stacked">{t('organization.labels.name')}</IonLabel>
            <IonInput value={org?.name || ''} onIonChange={(e:any) => setOrg({ ...org, name: e.detail.value })} />
          </IonItem>

          

          <IonItem>
            <IonLabel position="stacked">{t('organization.labels.address')}</IonLabel>
            <IonInput value={org?.meta?.address || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), address: e.detail.value } })} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">{t('organization.labels.contactEmail')}</IonLabel>
            <IonInput value={org?.meta?.contact?.email || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), contact: { ...(org?.meta?.contact || {}), email: e.detail.value } } })} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">{t('organization.labels.contactPhone')}</IonLabel>
            <IonInput value={org?.meta?.contact?.phone || ''} onIonChange={(e:any) => setOrg({ ...org, meta: { ...(org?.meta || {}), contact: { ...(org?.meta?.contact || {}), phone: e.detail.value } } })} />
          </IonItem>

          <div style={{ marginTop: 16 }}>
            <h4>{t('organization.logo')}</h4>
                <FileUploader
                  currentUrl={org?.meta?.logoUrl}
                  accept="image"
                  label={t('organization.logo')}
                  onSelected={(file: File, preview?: string) => setPendingFiles(prev => ({ ...prev, logo: file }))}
                  onRemovePending={() => setPendingFiles(prev => ({ ...prev, logo: undefined }))}
                  onDeleteSaved={async () => {
                    try {
                      const meta = { ...(org?.meta || {}) };
                      meta.logoUrl = '';
                      const updated = await orgApi.updateOrganization({ name: org?.name, meta });
                      setOrg(updated);
                      setToast({ show: true, message: t('organization.toasts.logoDeleted') });
                    } catch (e:any) {
                      setToast({ show: true, message: e?.response?.data?.message || t('organization.toasts.logoDeleteError') });
                    }
                  }}
                />
          </div>

          <div style={{ marginTop: 16 }}>
            <h4>{t('organization.isotype')}</h4>
              <FileUploader
                currentUrl={org?.meta?.isotypeUrl}
                accept="image"
                label={t('organization.isotype')}
                onSelected={(file: File, preview?: string) => setPendingFiles(prev => ({ ...prev, isotype: file }))}
                onRemovePending={() => setPendingFiles(prev => ({ ...prev, isotype: undefined }))}
                onDeleteSaved={async () => {
                  try {
                    const meta = { ...(org?.meta || {}) };
                    meta.isotypeUrl = '';
                    const updated = await orgApi.updateOrganization({ name: org?.name, meta });
                    setOrg(updated);
                    setToast({ show: true, message: t('organization.toasts.isotypeDeleted') });
                  } catch (e:any) {
                    setToast({ show: true, message: e?.response?.data?.message || t('organization.toasts.isotypeDeleteError') });
                  }
                }}
              />
          </div>

          <div style={{ marginTop: 16 }}>
            <IonButton onClick={save} disabled={loading}>{t('organization.buttons.save')}</IonButton>
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
