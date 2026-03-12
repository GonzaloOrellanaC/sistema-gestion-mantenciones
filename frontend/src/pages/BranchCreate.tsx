import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import * as branchesApi from '../api/branches';
import { getBranchTypes } from '../api/branchTypes';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chevronBackOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permisions';

const BranchCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [branchType, setBranchType] = useState<string>('');
  const [branchTypes, setBranchTypes] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const { permissions } = useAuth();
  // Cargar tipos de sucursal al montar
  useEffect(() => {
    const fetchBranchTypes = async () => {
      try {
        const data = await getBranchTypes();
        setBranchTypes(data);
        if (!branchType && data.length > 0) setBranchType(data[0]._id);
      } catch (e) {
        setToast({ show: true, message: t('branches.form.toasts.loadTypesError') });
      }
    };
    fetchBranchTypes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (params.id) {
      // If editing an existing branch, load its data
      const loadBranch = async () => {
        try {
          const branch = await branchesApi.getBranch(params.id!);
          setName(branch.name || '');
          setAddress(branch.address || '');
          setBranchType(branch.branchType?._id || branch.branchType || '');
        } catch (e:any) { setToast({ show: true, message: t('branches.form.toasts.loadError') }); }
      };
      loadBranch();
    }
  }, [params.id]);

  const handleSubmit = async () => {
    if (!name) { setToast({ show: true, message: t('branches.form.toasts.nameRequired') }); return; }
    if (!branchType) { setToast({ show: true, message: t('branches.form.toasts.typeRequired') }); return; }
    setLoading(true);
    try {
      if (params.id) {
        await branchesApi.updateBranch(params.id, { name, address, branchType });
      } else {
        await branchesApi.createBranch({ name, address, branchType });
      }
      history.push('/branches', { refresh: Date.now() });
    } catch (e:any) {
      setToast({ show: true, message: e?.response?.data?.message || t(params.id ? 'branches.form.toasts.editError' : 'branches.form.toasts.createError') });
    }
    finally { setLoading(false); }
  };

  // Clear form when entering this route (prevents previous values showing)
  React.useEffect(() => {
    if (!params.id) {
      setName('');
      setAddress('');
      if (branchTypes.length > 0) setBranchType(branchTypes[0]._id);
      else setBranchType('');
    }
    // eslint-disable-next-line
  }, [location.key, params.id, branchTypes]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill={'clear'} color={'dark'} slot='start' onClick={() => { if (history && typeof (history as any).goBack === 'function') (history as any).goBack(); else window.history.back(); }}>
            <IonIcon slot='icon-only' icon={chevronBackOutline} />
          </IonButton>
          <IonTitle>{params.id ? (!hasPermission(permissions, 'editarSucursales') ? t('branches.form.viewTitle') : t('branches.form.editTitle')) : t('branches.form.newTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 800 }}>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.name')}</IonLabel>
            <IonInput readonly={!hasPermission(permissions, 'editarSucursales')} value={name} placeholder={t('branches.form.placeholders.name')} onIonChange={e => setName(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.address')}</IonLabel>
            <IonInput readonly={!hasPermission(permissions, 'editarSucursales')} value={address} placeholder={t('branches.form.placeholders.address')} onIonChange={e => setAddress(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('branches.form.labels.type')}</IonLabel>
            {hasPermission(permissions, 'editarSucursales') ? <IonSelect value={branchType} placeholder={t('branches.form.placeholders.type')} onIonChange={e => setBranchType(e.detail.value)}>
              {branchTypes.map(bt => (
                <IonSelectOption key={bt._id} value={bt._id}>{bt.name}</IonSelectOption>
              ))}
            </IonSelect>
            :
            <IonInput value={branchTypes.find(bt => bt._id === branchType)?.name || ''} readonly />

          }
          </IonItem>
          <div style={{ marginTop: 12 }}>
            <IonButton expand="block" onClick={handleSubmit} disabled={loading || !hasPermission(permissions, 'editarSucursales')}>
              {loading
                ? (params.id ? t('branches.form.buttons.editing') : t('branches.form.buttons.creating'))
                : (params.id ? t('branches.form.buttons.edit') : t('branches.form.buttons.create'))}
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default BranchCreate;
