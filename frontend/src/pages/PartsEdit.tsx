import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonList, IonIcon } from '@ionic/react';
import { trash as trashIcon, cloudUploadOutline } from 'ionicons/icons';
import api from '../api/axios';

type Params = { id?: string };

const PartsEdit: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();
  const [form, setForm] = useState<any>({ name: '', serial: '', quantity: 1, notes: '', docs: [] as string[] });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/parts/${id}`);
        setForm({ name: data.name || '', serial: data.serial || '', quantity: data.quantity || 1, notes: data.notes || '', docs: data.docs || [] });
        // If part has docs, we won't fetch file metadata here; just show count
        if (data.docs && data.docs.length > 0) {
          setImagePreview(null);
        }
      } catch (err) {
        console.error('load part', err);
        setToast('Error loading part');
      } finally { setLoading(false); }
    })();
  }, [id]);

  const save = async () => {
    try {
      setLoading(true);
      if (id) {
        await api.put(`/api/parts/${id}`, form);
        setToast('Repuesto actualizado');
      } else {
        await api.post('/api/parts', form);
        setToast('Repuesto creado');
      }
      setTimeout(() => history.push('/parts'), 600);
    } catch (err) {
      console.error('save part', err);
      setToast('Error guardando repuesto');
    } finally { setLoading(false); }
  };

  // Upload helpers
  async function uploadFile(file: File, type = 'parts_docs') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const { data } = await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.meta;
  }

  const onDropImage = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    await handleImageFile(f);
  };

  const handleImageFile = async (f: File) => {
    try {
      setUploading(true);
      const meta = await uploadFile(f, 'parts_images');
      // attach file meta id to docs array
      setForm((prev: any) => ({ ...prev, docs: [...(prev.docs || []), meta._id] }));
      // preview
      const url = URL.createObjectURL(f);
      setImagePreview(url);
      setToast('Imagen subida');
    } catch (err) {
      console.error('upload image', err);
      setToast('Error subiendo imagen');
    } finally { setUploading(false); }
  };

  const onSelectDocs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const meta = await uploadFile(files[i], 'parts_docs');
        setForm((prev: any) => ({ ...prev, docs: [...(prev.docs || []), meta._id] }));
      }
      setToast('Documentos subidos');
    } catch (err) {
      console.error('upload docs', err);
      setToast('Error subiendo documentos');
    } finally { setUploading(false); }
  };

  const removeDoc = (index: number) => {
    setForm((prev: any) => ({ ...prev, docs: (prev.docs || []).filter((_: any, i: number) => i !== index) }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{id ? 'Editar repuesto' : 'Nuevo repuesto'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ padding: 12 }}>
        <IonItem>
          <IonLabel position="stacked">Nombre</IonLabel>
          <IonInput value={form.name} onIonChange={e => setForm({ ...form, name: e.detail.value })} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Serial</IonLabel>
          <IonInput value={form.serial} onIonChange={e => setForm({ ...form, serial: e.detail.value })} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Cantidad</IonLabel>
          <IonInput type="number" value={form.quantity} onIonChange={e => setForm({ ...form, quantity: Number(e.detail.value) })} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Notas</IonLabel>
          <IonInput value={form.notes} onIonChange={e => setForm({ ...form, notes: e.detail.value })} />
        </IonItem>

        {/* Image upload (drag & drop or click) */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDropImage}
          style={{ border: '2px dashed #E0E0E0', padding: 12, borderRadius: 6, marginTop: 12, textAlign: 'center' }}
        >
          {imagePreview ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <img src={imagePreview} style={{ height: 80, borderRadius: 6 }} alt="preview" />
              <IonButton onClick={() => { setImagePreview(null); /* remove last image id from docs */ setForm((p: any) => ({ ...p, docs: (p.docs || []).slice(0, -1) })); }} color="danger"><IonIcon icon={trashIcon} /> Eliminar</IonButton>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}><strong>Arrastra o haz click para subir una foto</strong></div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Formatos soportados: JPG, PNG (max 5MB)</div>
              <input ref={imageInputRef} id="part-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
              <IonButton onClick={() => imageInputRef.current?.click()}><IonIcon icon={cloudUploadOutline} /> Seleccionar imagen</IonButton>
            </div>
          )}
        </div>

        {/* Documents upload */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Documentos</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Puedes subir uno o varios archivos: pdf, doc, docx, txt (max 5MB c/u)</div>
          <input id="parts-docs-input" type="file" accept=".pdf,.doc,.docx,.txt" multiple style={{ display: 'none' }} onChange={onSelectDocs} />
          <label htmlFor="parts-docs-input"><IonButton>Seleccionar documentos</IonButton></label>

          <IonList style={{ marginTop: 8 }}>
            {(form.docs || []).map((d: any, idx: number) => (
              <div key={String(d)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid #F1F6F9', borderRadius: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>{String(d)}</div>
                <IonButton fill="clear" onClick={() => removeDoc(idx)}><IonIcon icon={trashIcon} /></IonButton>
              </div>
            ))}
          </IonList>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <IonButton onClick={() => history.push('/parts')}>Cancelar</IonButton>
          <IonButton onClick={save} disabled={loading}>{id ? 'Guardar' : 'Crear'}</IonButton>
        </div>

        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default PartsEdit;
