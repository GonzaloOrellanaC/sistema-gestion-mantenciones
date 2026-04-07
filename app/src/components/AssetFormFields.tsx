import React, { useState, useEffect, useRef } from 'react';
import { IonButton, IonInput, IonTextarea, IonCard, IonCardContent, IonItem, IonLabel, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonSearchbar, IonIcon } from '@ionic/react';
import { addOutline, cameraOutline, trashOutline } from 'ionicons/icons';
import { axiosInstance } from '../api/axios';

type Props = {
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onSave: (payload: any) => void;
  onCancel: () => void;
  brandId?: string | null;
  setBrandId?: (id: string | null) => void;
  brandName?: string | null;
  setBrandName?: (n: string | null) => void;
  modelId?: string | null;
  setModelId?: (id: string | null) => void;
  modelName?: string | null;
  setModelName?: (n: string | null) => void;
  typeId?: string | null;
  setTypeId?: (id: string | null) => void;
  typeName?: string | null;
  setTypeName?: (n: string | null) => void;
};

const ActiveFormFields: React.FC<Props> = ({ name, setName, code, setCode, description, setDescription, onSave, onCancel, brandId, setBrandId, brandName, setBrandName, modelId, setModelId, modelName, setModelName, typeId, setTypeId, typeName, setTypeName }) => {
  const [showPicker, setShowPicker] = useState<{ field: 'brand'|'model'|'type'|null }>({ field: null });
  const [items, setItems] = useState<Array<any>>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [images, setImages] = useState<Array<{ file: File; url: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // reset modal state when closed
    if (!showPicker.field) {
      setItems([]); setQuery(''); setAdding(false); setNewName('');
    }
  }, [showPicker.field]);

  function toTitleCase(s: string) {
    return s.split(' ').map(w => {
      const w2 = w.trim(); if (!w2) return '';
      return w2.charAt(0).toUpperCase() + w2.slice(1).toLowerCase();
    }).filter(Boolean).join(' ');
  }

  async function loadItems(field: 'brand'|'model'|'type') {
    try {
      let path = '/brands';
      if (field === 'model') path = '/device-models';
      if (field === 'type') path = '/asset-types';
      const res = await axiosInstance.get(path);
      const data = res.data;
      const list = data.items || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
    }
  }

  async function createItem(field: 'brand'|'model'|'type', rawName: string) {
    const nameToSend = toTitleCase(rawName);
    try {
      let path = '/brands';
      if (field === 'model') path = '/device-models';
      if (field === 'type') path = '/asset-types';
      const payload: any = { name: nameToSend };
      // when creating a device model, backend expects brandId and typeId
      if (field === 'model') {
        if (!brandId || !typeId) {
          // inform user that brand and type must be selected first
          window.alert('Para crear un modelo debes seleccionar primero Marca y Tipo');
          throw new Error('Missing brandId or typeId');
        }
        payload.brandId = brandId;
        payload.typeId = typeId;
      }
      const res = await axiosInstance.post(path, payload);
      const created = res.data;
      return created;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  function handleAddPhotosClick() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxAllowed = 10 - images.length;
    if (maxAllowed <= 0) {
      window.alert('Máximo 10 imágenes.');
      return;
    }
    const toAdd: Array<{ file: File; url: string }> = [];
    for (let i = 0; i < files.length && toAdd.length < maxAllowed; i++) {
      const f = files[i];
      if (f.size > 2 * 1024 * 1024) {
        window.alert(`${f.name} excede el tamaño máximo de 2 MB.`);
        continue;
      }
      const url = URL.createObjectURL(f);
      toAdd.push({ file: f, url });
    }
    if (toAdd.length) setImages(prev => [...prev, ...toAdd]);
    // reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImageAt(index: number) {
    setImages(prev => {
      const copy = prev.slice();
      const removed = copy.splice(index, 1)[0];
      try { URL.revokeObjectURL(removed.url); } catch (e) {}
      return copy;
    });
  }

  useEffect(() => {
    return () => {
      images.forEach(img => { try { URL.revokeObjectURL(img.url); } catch (e) {} });
    };
  }, [images]);

  return (
    <IonCard style={{ marginTop: 16 }}>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel position="stacked">Código</IonLabel>
          <IonInput value={code} onIonChange={(e) => setCode(String(e.detail.value || ''))} />
        </IonItem>

        <IonItem button onClick={() => { setShowPicker({ field: 'brand' }); loadItems('brand'); }}>
          <IonLabel position="stacked">Marca</IonLabel>
          <div>{brandName || 'Seleccionar marca'}</div>
        </IonItem>

        <IonItem button onClick={() => { setShowPicker({ field: 'type' }); loadItems('type'); }}>
          <IonLabel position="stacked">Tipo</IonLabel>
          <div>{typeName || 'Seleccionar tipo'}</div>
        </IonItem>

        <IonItem button onClick={() => { setShowPicker({ field: 'model' }); loadItems('model'); }}>
          <IonLabel position="stacked">Modelo</IonLabel>
          <div>{modelName || 'Seleccionar modelo'}</div>
        </IonItem>

        <IonItem lines="none">
          <IonLabel position="stacked">Nombre</IonLabel>
          <IonInput value={name} onIonChange={(e) => setName(String(e.detail.value || ''))} />
        </IonItem>
        <IonItem lines="none">
          <IonLabel position="stacked">Descripción</IonLabel>
          <IonTextarea value={description} onIonChange={(e) => setDescription(String(e.detail.value || ''))} />
        </IonItem>

        <div style={{ marginTop: 12 }}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilesSelected} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <IonButton onClick={handleAddPhotosClick}>
              <IonIcon icon={cameraOutline} style={{ marginRight: 8 }} />Agregar fotos ({images.length}/10)
            </IonButton>
            <div style={{ color: '#64748b', fontSize: 13 }}>Máx 10 imágenes • 2 MB c/u</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((img, idx) => (
              <div key={img.url} style={{ width: 84, height: 84, borderRadius: 8, overflow: 'hidden', position: 'relative', boxShadow: '0 6px 18px rgba(2,40,71,0.06)' }}>
                <img src={img.url} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removeImageAt(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 16, padding: 4, cursor: 'pointer' }}>
                  <IonIcon icon={trashOutline} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <IonButton expand="block" onClick={() => {
            const payload = {
              name,
              code,
              description,
              brandId,
              brandName,
              modelId,
              modelName,
              typeId,
              typeName,
              images: images.map(i => i.file),
            };
            onSave(payload);
          }}>Guardar</IonButton>
          <IonButton fill="clear" expand="block" onClick={onCancel}>Cancelar</IonButton>
        </div>

        <IonModal isOpen={!!showPicker.field} onDidDismiss={() => setShowPicker({ field: null })}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{showPicker.field === 'brand' ? 'Seleccionar Marca' : showPicker.field === 'model' ? 'Seleccionar Modelo' : 'Seleccionar Tipo'}</IonTitle>
              <IonButton slot="end" onClick={() => setShowPicker({ field: null })}>Cerrar</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: 12 }}>
              <IonSearchbar value={query} onIonChange={(e) => setQuery(String(e.detail.value || ''))} placeholder="Buscar por nombre" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
                <IonButton color="success" onClick={() => { setAdding(true); setNewName(''); }}>
                  <IonIcon icon={addOutline} />
                </IonButton>
              </div>
              {adding && (
                <div style={{ padding: 8 }}>
                  <IonInput placeholder="Nuevo nombre" value={newName} onIonChange={(e) => setNewName(String(e.detail.value || ''))} />
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <IonButton onClick={async () => {
                      if (!newName.trim()) return;
                      try {
                        const created = await createItem(showPicker.field!, newName.trim());
                        // set selected
                        if (showPicker.field === 'brand') { setBrandId && setBrandId(created._id); setBrandName && setBrandName(created.name); }
                        if (showPicker.field === 'model') { setModelId && setModelId(created._id); setModelName && setModelName(created.name); }
                        if (showPicker.field === 'type') { setTypeId && setTypeId(created._id); setTypeName && setTypeName(created.name); }
                        setShowPicker({ field: null });
                      } catch (e) { /* ignore */ }
                    }}>Agregar</IonButton>
                    <IonButton fill="clear" onClick={() => { setAdding(false); setNewName(''); }}>Cancelar</IonButton>
                  </div>
                </div>
              )}

              <IonList>
                {items.filter(it => !query || (it.name || '').toLowerCase().includes(query.toLowerCase())).map(it => (
                  <IonItem key={it._id} button onClick={() => {
                    if (showPicker.field === 'brand') { setBrandId && setBrandId(it._id); setBrandName && setBrandName(it.name); }
                    if (showPicker.field === 'model') { setModelId && setModelId(it._id); setModelName && setModelName(it.name); }
                    if (showPicker.field === 'type') { setTypeId && setTypeId(it._id); setTypeName && setTypeName(it.name); }
                    setShowPicker({ field: null });
                  }}>
                    {it.name}
                  </IonItem>
                ))}
              </IonList>
            </div>
          </IonContent>
        </IonModal>

      </IonCardContent>
    </IonCard>
  );
};

export default ActiveFormFields;
