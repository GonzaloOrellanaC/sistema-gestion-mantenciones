import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast, IonIcon, IonGrid, IonRow, IonCol, IonFooter } from '@ionic/react';
import assetsApi from '../api/assets';
import FileUploader from '../components/Widgets/FileUploader.widget';
import { useAuth } from '../context/AuthContext';
import brandsApi from '../api/brands';
import deviceModelsApi from '../api/deviceModels';
import assetTypesApi from '../api/assetTypes';
import * as branchesApi from '../api/branches';
import { chevronBackOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

const AssetCreate: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const [isEdit, setIsEdit] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(undefined);
  const { t } = useTranslation();

  const loadLists = async () => {
    try {
      const b = await brandsApi.listBrands({});
      const m = await deviceModelsApi.listDeviceModels({});
      const t = await assetTypesApi.listAssetTypes({});
      const br = await branchesApi.listBranches({});
      setBrands(b.items || []);
      setModels(m.items || []);
      setTypes(t.items || []);
      setBranches(br.items || []);
    } catch (e) {
      console.warn('load lists err', e);
    }
  };

  useEffect(() => { loadLists(); }, []);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const doc = await assetsApi.getAsset(id);
        if (!mounted) return;
        setIsEdit(true);
        setName(doc.name || '');
        setSerial(doc.serial || '');
        setBrandId(doc.brandId?._id || doc.brandId || '');
        setModelId(doc.modelId?._id || doc.modelId || '');
        setTypeId(doc.typeId?._id || doc.typeId || '');
        setBranchId(doc.branchId?._id || doc.branchId || '');
        setNotes(doc.notes || '');
        // if asset has docs, build a preview URL for the first doc
        if (doc.docs && doc.docs.length) {
          const docMeta = doc.docs[0];
          const p = (docMeta.path || docMeta.meta?.thumbnailPath || '').replace(/\\/g, '/');
          const idx = p.indexOf('/files/images/');
          const base = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');
          if (idx !== -1) {
            const rel = p.substring(idx + '/files/images/'.length);
            setCurrentPhotoUrl(`${base}/images/${rel}`);
          } else if (p.indexOf('/images/') !== -1) {
            const rel = p.substring(p.indexOf('/images/') + '/images/'.length);
            setCurrentPhotoUrl(`${base}/images/${rel}`);
          } else if (docMeta.filename && doc.orgId) {
            setCurrentPhotoUrl(`${base}/images/${doc.orgId}/misc/${docMeta.filename}`);
          }
        }
      } catch (e) {
        console.error('load asset err', e);
        setToast({ show: true, message: 'Error cargando activo' });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const createBrand = async () => {
    const name = window.prompt(t('assets.create.prompts.brandName'));
    if (!name) return;
    try {
      const b = await brandsApi.createBrand({ name });
      setBrandId(b._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando marca' }); }
  };

  const createType = async () => {
    const name = window.prompt(t('assets.create.prompts.typeName'));
    if (!name) return;
    try {
      const t = await assetTypesApi.createAssetType({ name });
      setTypeId(t._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando tipo' }); }
  };

  const createModel = async () => {
    const name = window.prompt(t('assets.create.prompts.modelName'));
    if (!name) return;
    // require brand and type
    if (!brandId) { setToast({ show: true, message: t('assets.create.toasts.selectBrandFirst') }); return; }
    if (!typeId) { setToast({ show: true, message: t('assets.create.toasts.selectTypeFirst') }); return; }
    try {
      const m = await deviceModelsApi.createDeviceModel({ name, brandId, typeId });
      setModelId(m._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando modelo' }); }
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!name) { setToast({ show: true, message: t('assets.create.toasts.nameRequired') }); return; }
    setLoading(true);
    try {
      let res: any;
      if (photo || doc) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('serial', serial);
        if (brandId) fd.append('brandId', brandId);
        if (modelId) fd.append('modelId', modelId);
        if (typeId) fd.append('typeId', typeId);
        if (branchId) fd.append('branchId', branchId);
        fd.append('notes', notes || '');
        if (user?.orgId) fd.append('orgId', user.orgId);
        if (photo) fd.append('photo', photo);
        if (doc) fd.append('doc', doc);
        if (isEdit && id) {
          // use update endpoint
          res = await assetsApi.updateAsset(id, fd as any);
        } else {
          res = await assetsApi.createAsset(fd);
        }
      } else {
        const payload: any = { name, serial, brandId: brandId || undefined, modelId: modelId || undefined, typeId: typeId || undefined, branchId: branchId || undefined, notes };
        if (isEdit && id) {
          res = await assetsApi.updateAsset(id, payload);
        } else {
          res = await assetsApi.createAsset(payload);
        }
      }
      if (res && res._id) {
        if (history && typeof (history as any).push === 'function') {
          (history as any).push('/assets');
        } else {
          window.location.href = '/assets';
        }
        return;
      }
      setToast({ show: true, message: t('assets.create.toasts.created') });
    } catch (e:any) {
      console.error('create asset err', e);
      setToast({ show: true, message: e?.response?.data?.message || t('assets.create.toasts.createError') });
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButton fill={'clear'} color={'dark'} slot='start' onClick={() => { if (history && typeof (history as any).goBack === 'function') (history as any).goBack(); else window.history.back(); }}>
            <IonIcon slot='icon-only' icon={chevronBackOutline} />
          </IonButton>
          <IonTitle style={{marginLeft: 10}}>{`${id ? 'Editar Activo' : 'Crear Activo'}`}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="7">
              <div style={{ maxWidth: '100%', padding: 10 }}>
                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.name')}</IonLabel>
                  <IonInput value={name} onIonChange={e => setName(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.serial')}</IonLabel>
                  <IonInput value={serial} onIonChange={e => setSerial(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.brand')}</IonLabel>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <IonSelect value={brandId} onIonChange={e => setBrandId(e.detail.value)} style={{ flex: 1 }}>
                      <IonSelectOption value="">--Seleccione--</IonSelectOption>
                      {brands.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
                    </IonSelect>
                    <IonButton onClick={createBrand}>Nuevo</IonButton>
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.branch')}</IonLabel>
                  <IonSelect value={branchId} onIonChange={e => setBranchId(e.detail.value)}>
                    <IonSelectOption value="">--Seleccione--</IonSelectOption>
                    {branches.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.type')}</IonLabel>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <IonSelect value={typeId} onIonChange={e => setTypeId(e.detail.value)} style={{ flex: 1 }}>
                      <IonSelectOption value="">--Seleccione--</IonSelectOption>
                      {types.map(t => <IonSelectOption key={t._id} value={t._id}>{t.name}</IonSelectOption>)}
                    </IonSelect>
                    <IonButton onClick={createType}>Nuevo</IonButton>
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.model')}</IonLabel>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <IonSelect value={modelId} onIonChange={e => setModelId(e.detail.value)} style={{ flex: 1 }}>
                      <IonSelectOption value="">--Seleccione--</IonSelectOption>
                      {models.map(m => <IonSelectOption key={m._id} value={m._id}>{m.name}</IonSelectOption>)}
                    </IonSelect>
                    <IonButton onClick={createModel}>Nuevo</IonButton>
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('assets.create.labels.notes')}</IonLabel>
                  <IonInput value={notes} onIonChange={e => setNotes(e.detail.value || '')} />
                </IonItem>
              </div>
            </IonCol>

            <IonCol sizeMd="5">
              <div style={{padding: 10}}>
                <div style={{ marginTop: 0 }}>
                  <h4>{t('assets.create.photo.title')}</h4>
                  <FileUploader accept="image" label={t('assets.create.photo.label')} currentUrl={currentPhotoUrl} onSelected={(f) => setPhoto(f)} onRemovePending={() => { setPhoto(null); setCurrentPhotoUrl(undefined); }} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <h4>{t('assets.create.doc.title')}</h4>
                  <FileUploader accept="doc" label={t('assets.create.doc.label')} onSelected={(f) => setDoc(f)} onRemovePending={() => setDoc(null)} />
                </div>

              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
      <IonFooter className="ion-padding">
        <IonButton onClick={handleSubmit} disabled={loading}>{loading ? (isEdit ? t('assets.create.buttons.updating') : t('assets.create.buttons.creating')) : (isEdit ? t('assets.create.buttons.update') : t('assets.create.buttons.create'))}</IonButton>
      </IonFooter>
    </IonPage>
  );
}

export default AssetCreate;