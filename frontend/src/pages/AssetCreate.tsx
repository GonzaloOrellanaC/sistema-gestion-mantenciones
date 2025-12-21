import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast } from '@ionic/react';
import assetsApi from '../api/assets';
import FileUploader from '../components/Widgets/FileUploader.widget';
import { useAuth } from '../context/AuthContext';
import brandsApi from '../api/brands';
import deviceModelsApi from '../api/deviceModels';
import assetTypesApi from '../api/assetTypes';
import * as branchesApi from '../api/branches';

const AssetCreate: React.FC = () => {
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

  const createBrand = async () => {
    const name = window.prompt('Nombre de la marca');
    if (!name) return;
    try {
      const b = await brandsApi.createBrand({ name });
      setBrandId(b._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando marca' }); }
  };

  const createType = async () => {
    const name = window.prompt('Nombre del tipo');
    if (!name) return;
    try {
      const t = await assetTypesApi.createAssetType({ name });
      setTypeId(t._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando tipo' }); }
  };

  const createModel = async () => {
    const name = window.prompt('Nombre del modelo');
    if (!name) return;
    // require brand and type
    if (!brandId) { setToast({ show: true, message: 'Seleccione o cree una marca antes de crear el modelo' }); return; }
    if (!typeId) { setToast({ show: true, message: 'Seleccione o cree un tipo antes de crear el modelo' }); return; }
    try {
      const m = await deviceModelsApi.createDeviceModel({ name, brandId, typeId });
      setModelId(m._id);
      await loadLists();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando modelo' }); }
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!name) { setToast({ show: true, message: 'Ingrese nombre del activo' }); return; }
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
        res = await assetsApi.createAsset(fd);
      } else {
        const payload: any = { name, serial, brandId: brandId || undefined, modelId: modelId || undefined, typeId: typeId || undefined, branchId: branchId || undefined, notes };
        res = await assetsApi.createAsset(payload);
      }
      if (res && res._id) {
        history.push('/assets');
        return;
      }
      setToast({ show: true, message: 'Activo creado' });
    } catch (e:any) {
      console.error('create asset err', e);
      setToast({ show: true, message: e?.response?.data?.message || 'Error creando activo' });
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Crear Activo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 900 }}>
          <IonItem>
            <IonLabel position="stacked">Nombre</IonLabel>
            <IonInput value={name} onIonChange={e => setName(e.detail.value || '')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Serial</IonLabel>
            <IonInput value={serial} onIonChange={e => setSerial(e.detail.value || '')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Marca</IonLabel>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <IonSelect value={brandId} onIonChange={e => setBrandId(e.detail.value)} style={{ flex: 1 }}>
                <IonSelectOption value="">--Seleccione--</IonSelectOption>
                {brands.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
              </IonSelect>
              <IonButton onClick={createBrand}>Nuevo</IonButton>
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Sucursal</IonLabel>
            <IonSelect value={branchId} onIonChange={e => setBranchId(e.detail.value)}>
              <IonSelectOption value="">--Seleccione--</IonSelectOption>
              {branches.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Tipo</IonLabel>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <IonSelect value={typeId} onIonChange={e => setTypeId(e.detail.value)} style={{ flex: 1 }}>
                <IonSelectOption value="">--Seleccione--</IonSelectOption>
                {types.map(t => <IonSelectOption key={t._id} value={t._id}>{t.name}</IonSelectOption>)}
              </IonSelect>
              <IonButton onClick={createType}>Nuevo</IonButton>
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Modelo</IonLabel>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <IonSelect value={modelId} onIonChange={e => setModelId(e.detail.value)} style={{ flex: 1 }}>
                <IonSelectOption value="">--Seleccione--</IonSelectOption>
                {models.map(m => <IonSelectOption key={m._id} value={m._id}>{m.name}</IonSelectOption>)}
              </IonSelect>
              <IonButton onClick={createModel}>Nuevo</IonButton>
            </div>
          </IonItem>

          

          <IonItem>
            <IonLabel position="stacked">Notas</IonLabel>
            <IonInput value={notes} onIonChange={e => setNotes(e.detail.value || '')} />
          </IonItem>

          <div style={{ marginTop: 12 }}>
            <h4>Foto del activo</h4>
            <FileUploader accept="image" label="Foto (JPG/PNG)" onSelected={(f) => setPhoto(f)} onRemovePending={() => setPhoto(null)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Documento del activo</h4>
            <FileUploader accept="doc" label="Documento (PDF/DOC/DOCX)" onSelected={(f) => setDoc(f)} onRemovePending={() => setDoc(null)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <IonButton expand="block" onClick={handleSubmit} disabled={loading}>{loading ? 'Creando...' : 'Crear Activo'}</IonButton>
          </div>

          <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AssetCreate;
