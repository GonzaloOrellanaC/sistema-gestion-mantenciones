import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStylingContext } from '../context/StylingContext';
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
  const { buttonCancel } = useStylingContext();
  const history = useHistory();
  const { t } = useTranslation();

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setToast({ show: true, message: t('supplies.create.toasts.nameRequired') }); return; }
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
      setToast({ show: true, message: t('supplies.create.toasts.created') });
      setTimeout(() => history.push('/supplies'), 500);
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: err?.message || t('supplies.create.toasts.createError') });
    } finally { setSaving(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('supplies.create.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={onSubmit} style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" label={t('supplies.create.labels.name')} value={name} onInput={(e:any) => setName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Textarea label={t('supplies.create.labels.description')} value={description} onChange={(v: string) => setDescription(v)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="number" label={t('supplies.create.labels.quantity')} value={quantity === '' ? '' : String(quantity)} onInput={(e:any) => setQuantity(e.detail?.value === '' ? '' : Number(e.detail?.value))} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <FileUploader accept="image" label={t('supplies.create.labels.photo')} onSelected={(f) => setPhoto(f)} onRemovePending={() => setPhoto(null)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <FileUploader accept="doc" label={t('supplies.create.labels.doc')} onSelected={(f) => setDoc(f)} onRemovePending={() => setDoc(null)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <IonButton type="submit" color="primary" disabled={saving}>{saving ? t('supplies.create.buttons.saving') : t('supplies.create.buttons.create')}</IonButton>
            <IonButton style={buttonCancel} onClick={() => history.push('/supplies')}>{t('common.cancel')}</IonButton>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default SupplyCreate;
