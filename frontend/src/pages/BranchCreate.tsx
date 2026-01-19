import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonSelect, IonSelectOption } from '@ionic/react';
import * as branchesApi from '../api/branches';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BranchCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [branchType, setBranchType] = useState<'bodega' | 'taller'>('taller');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (params.id) {
      // If editing an existing branch, load its data
      const loadBranch = async () => {
        try {
          const branch = await branchesApi.getBranch(params.id!);
          setName(branch.name || '');
          setAddress(branch.address || '');
          setBranchType((branch.branchType as 'bodega' | 'taller') || 'taller');
        } catch (e:any) { setToast({ show: true, message: t('branches.form.toasts.loadError') }); }
      };
      loadBranch();
    }
  }, [params.id]);

  const handleCreate = async () => {
    if (!name) { setToast({ show: true, message: t('branches.form.toasts.nameRequired') }); return; }
    setLoading(true);
    try {
      await branchesApi.createBranch({ name, address, branchType });
      history.push('/branches', { refresh: Date.now() });
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || t('branches.form.toasts.createError') }); }
    finally { setLoading(false); }
  };

  // Clear form when entering this route (prevents previous values showing)
  React.useEffect(() => {
    if (!params.id) {
      setName('');
      setAddress('');
      setBranchType('taller');
    }
  }, [location.key, params.id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{params.id ? t('branches.form.editTitle') : t('branches.form.newTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 800 }}>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.name')}</IonLabel>
            <IonInput value={name} placeholder={t('branches.form.placeholders.name')} onIonChange={e => setName(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.address')}</IonLabel>
            <IonInput value={address} placeholder={t('branches.form.placeholders.address')} onIonChange={e => setAddress(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.type')}</IonLabel>
            <IonSelect value={branchType} placeholder={t('branches.form.placeholders.type')} onIonChange={e => setBranchType(e.detail.value)}>
              <IonSelectOption value="bodega">{t('branches.form.options.bodega')}</IonSelectOption>
              <IonSelectOption value="taller">{t('branches.form.options.taller')}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <div style={{ marginTop: 12 }}>
            <IonButton expand="block" onClick={handleCreate} disabled={loading}>{loading ? t('branches.form.buttons.creating') : t('branches.form.buttons.create')}</IonButton>
          </div>
        </div>
        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default BranchCreate;
