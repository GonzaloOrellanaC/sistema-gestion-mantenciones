import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToast } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import { Textarea } from '../components/Widgets/Textarea.widget';
import FileUploader from '../components/Widgets/FileUploader.widget';
import * as suppliesApi from '../api/supplies';
import { useHistory } from 'react-router-dom';

const SupplyCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const history = useHistory();

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setToast({ show: true, message: 'El nombre es requerido' }); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description || '');
      fd.append('quantity', (quantity === '' ? '0' : String(quantity)));
      if (user?.orgId) fd.append('orgId', user.orgId);
      if (photo) fd.append('photo', photo);
      if (doc) fd.append('doc', doc);
      await suppliesApi.createSupply(fd);
      setToast({ show: true, message: 'Insumo creado' });
      setTimeout(() => history.push('/supplies'), 500);
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: err?.message || 'Error creando insumo' });
    } finally { setSaving(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Crear Insumo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={onSubmit} style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" label="Nombre" value={name} onInput={(e:any) => setName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Textarea label="Descripción" value={description} onChange={(v: string) => setDescription(v)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="number" label="Cantidad" value={quantity === '' ? '' : String(quantity)} onInput={(e:any) => setQuantity(e.detail?.value === '' ? '' : Number(e.detail?.value))} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <FileUploader accept="image" label="Foto (JPG/PNG)" onSelected={(f) => setPhoto(f)} onRemovePending={() => setPhoto(null)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <FileUploader accept="doc" label="Documento (PDF / DOC / DOCX)" onSelected={(f) => setDoc(f)} onRemovePending={() => setDoc(null)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <IonButton type="submit" color="primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear Insumo'}</IonButton>
            <IonButton color="medium" onClick={() => history.push('/supplies')}>Cancelar</IonButton>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default SupplyCreate;
