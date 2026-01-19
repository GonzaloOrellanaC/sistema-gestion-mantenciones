import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToast, IonIcon } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import { Textarea } from '../components/Widgets/Textarea.widget';
import FileUploader from '../components/Widgets/FileUploader.widget';
import api from '../api/axios';
import * as suppliesApi from '../api/supplies';
import { useStylingContext } from '../context/StylingContext';
import { chevronBackOutline } from 'ionicons/icons';

type Params = { id?: string };

// Module-level cache and in-flight promise map to avoid duplicate requests across remounts
const supplyCache = new Map<string, any>();
const supplyPromises = new Map<string, Promise<any>>();

const SupplyEdit: React.FC = () => {
  const { id } = useParams<Params>();
  const { buttonCancel } = useStylingContext();
  const history = useHistory();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // If cached, use it
        if (supplyCache.has(id)) {
          const supply = supplyCache.get(id);
          if (!mounted) return;
          setName(supply.name || '');
          setDescription(supply.description || '');
          setQuantity(typeof supply.quantity === 'number' ? supply.quantity : (supply.quantity ? Number(supply.quantity) : ''));
          return;
        }

        // Reuse in-flight promise if present
        let p = supplyPromises.get(id);
        if (!p) {
          p = suppliesApi.getSupplyById(id as string).then((resp) => {
            const payload = resp && (resp as any).data ? (resp as any).data : resp;
            const supply = payload && (payload.item || payload.supply || payload.data) ? (payload.item || payload.supply || payload.data) : payload;
            if (supply) supplyCache.set(id, supply);
            supplyPromises.delete(id);
            return supply;
          }).catch((err) => { supplyPromises.delete(id); throw err; });
          supplyPromises.set(id, p);
        }

        const supply = await p;
        if (!mounted) return;
        if (!supply) {
          setToast({ show: true, message: t('supplies.edit.toasts.notFound') });
          return;
        }
        setName(supply.name || '');
        setDescription(supply.description || '');
        setQuantity(typeof supply.quantity === 'number' ? supply.quantity : (supply.quantity ? Number(supply.quantity) : ''));
      } catch (err: any) {
        console.error('fetch supply', err);
        setToast({ show: true, message: t('supplies.edit.toasts.loadError') });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setToast({ show: true, message: t('supplies.create.toasts.nameRequired') }); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description || '');
      fd.append('quantity', (quantity === '' ? '0' : String(quantity)));
      if (photo) fd.append('photo', photo);
      if (doc) fd.append('doc', doc);
      if (id) {
        await api.put(`/api/supplies/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        // invalidate cache entry so list sees updates later
        supplyCache.delete(id);
        setToast({ show: true, message: t('supplies.edit.toasts.updated') });
      } else {
        await suppliesApi.createSupply(fd);
        setToast({ show: true, message: t('supplies.create.toasts.created') });
      }
      setTimeout(() => history.push('/supplies'), 500);
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: err?.message || t('supplies.edit.toasts.saveError') });
    } finally { setSaving(false); }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButton slot="start" fill="clear" color={'dark'} onClick={() => history.goBack()}>
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <IonTitle>{id ? t('supplies.edit.title') : t('supplies.create.title')}</IonTitle>
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
            <IonButton type="submit" color="primary" disabled={saving}>{saving ? t('supplies.create.buttons.saving') : (id ? t('supplies.edit.buttons.save') : t('supplies.create.buttons.create'))}</IonButton>
            <IonButton style={buttonCancel} onClick={() => history.goBack()}>{t('common.cancel')}</IonButton>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default SupplyEdit;
