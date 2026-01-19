import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useStylingContext } from '../context/StylingContext';
import { useParams, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonList, IonIcon, IonModal, IonFooter, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption } from '@ionic/react';
import { trash as trashIcon, cloudUploadOutline, chevronBackOutline } from 'ionicons/icons';
import api from '../api/axios';

type Params = { id?: string };

const PartsEdit: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();
  const { t } = useTranslation();
  const { buttonCancel } = useStylingContext();
  const [form, setForm] = useState<any>({ name: '', serial: '', quantity: 1, notes: '', docs: [] as string[], price: undefined as number | undefined, lotId: null });
  const [lots, setLots] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);
  const [removedDocIds, setRemovedDocIds] = useState<string[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/parts/${id}`);
        // backend may return lotId populated or legacy lot string
        const lotObj = data.lotId || (data.lot ? { code: data.lot, _id: data.lot } : null);
        setForm({ name: data.name || '', serial: data.serial || '', quantity: data.quantity || 1, notes: data.notes || '', docs: data.docs || [], price: data.price, lotId: lotObj });
        // If part has docs, we won't fetch file metadata here; just show count
        if (data.docs && data.docs.length > 0) {
          setImagePreview(null);
        }
      } catch (err) {
        console.error('load part', err);
        setToast(t('partsEdit.toasts.loadError') || 'Error loading part');
      } finally { setLoading(false); }
    })();
  }, [id]);

  // load available lots for selection
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/lots');
        if (Array.isArray(data)) setLots(data);
        else if (Array.isArray(data.items)) setLots(data.items);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  

  const filteredLots = useMemo(() => {
    if (!supplierFilter) return lots;
    return lots.filter(l => (l.supplier || '').toLowerCase() === supplierFilter.toLowerCase());
  }, [lots, supplierFilter]);

  const suppliers = useMemo(() => {
    const arr = Array.from(new Set(lots.map(l => l.supplier).filter(Boolean)));
    return arr.sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [lots]);

  const [showLotModal, setShowLotModal] = useState(false);

  const currency = useMemo(() => {
    try { return (localStorage.getItem('appCurrency') || 'CLP'); } catch { return 'CLP'; }
  }, []);

  function formatCurrency(value?: number | null) {
    if (value == null) return '';
    const curr = currency || 'CLP';
    const locale = curr === 'USD' ? 'en-US' : 'es-CL';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(value);
    } catch (e) {
      return String(value) + ' ' + curr;
    }
  }

  function formatInputValue(value?: number | null) {
    if (value == null) return '';
    const curr = currency || 'CLP';
    const locale = curr === 'USD' ? 'en-US' : 'es-CL';
    try {
      // show without currency symbol in input, but with localized grouping/decimals
      const parts = new Intl.NumberFormat(locale, { maximumFractionDigits: curr === 'USD' ? 2 : 0 }).format(value);
      return parts;
    } catch (e) {
      return String(value);
    }
  }

  function parseInputValue(input: string): number | undefined {
    if (!input) return undefined;
    const curr = currency || 'CLP';
    // remove currency symbols and spaces
    let s = input.replace(/[^0-9,\.]/g, '').trim();
    if (curr === 'CLP') {
      // remove dots used as thousand separators, commas maybe present as decimals (ignore)
      s = s.replace(/\./g, '').replace(/,/g, '');
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : undefined;
    } else {
      // USD: remove commas as thousands, keep dot as decimal
      s = s.replace(/,/g, '');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : undefined;
    }
  }

  const save = async () => {
    try {
      setLoading(true);
      const payload = { ...form } as any;
      if (payload.lotId && typeof payload.lotId === 'object') payload.lotId = payload.lotId._id || payload.lotId;
      // Prepare docs list excluding those marked for deletion
      const existingDocIds: string[] = (form.docs || []).map((d: any) => (d && typeof d === 'object' ? d._id : String(d))).filter(Boolean);
      const keptExisting = existingDocIds.filter(id => !removedDocIds.includes(id));
      payload.docs = keptExisting;

      // Upload pending docs now, append their ids to payload.docs
      if (pendingDocs && pendingDocs.length > 0) {
        try {
          setUploading(true);
          const uploads = await Promise.all(pendingDocs.map(f => uploadFile(f, 'parts_docs')));
          const ids = uploads.map(u => u._id).filter(Boolean);
          payload.docs = [ ...(payload.docs || []), ...ids ];
          // clear pending after successful upload
          setPendingDocs([]);
        } catch (err) {
          console.error('upload pending docs', err);
          setToast(t('partsEdit.toasts.pendingUploadError') || 'Error uploading pending documents');
          setUploading(false);
          setLoading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Include docsToRemove so backend can delete files and FileMeta records
      if (removedDocIds && removedDocIds.length > 0) payload.docsToRemove = removedDocIds;

      if (id) {
        await api.put(`/api/parts/${id}`, payload);
        setToast(t('partsEdit.toasts.updated') || 'Part updated');
      } else {
        await api.post('/api/parts', payload);
        setToast(t('partsEdit.toasts.created') || 'Part created');
      }
      setTimeout(() => history.push('/parts'), 600);
    } catch (err) {
      console.error('save part', err);
      setToast(t('partsEdit.toasts.saveError') || 'Error saving part');
    } finally { setLoading(false); }
  };

  // Upload helpers
  async function uploadFile(file: File, type = 'parts_docs') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const { data } = await api.post('/api/files/upload', fd);
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
      if (f.size > MAX_FILE_SIZE) {
        setToast(t('partsEdit.toasts.fileTooLarge') || 'File is larger than 5MB');
        return;
      }
      setUploading(true);
      const meta = await uploadFile(f, 'parts_images');
      // attach file meta id to docs array
      setForm((prev: any) => ({ ...prev, docs: [...(prev.docs || []), meta._id] }));
      // preview
      const url = URL.createObjectURL(f);
      setImagePreview(url);
      setToast(t('partsEdit.toasts.imageUploaded') || 'Image uploaded');
    } catch (err) {
      console.error('upload image', err);
      setToast(t('partsEdit.toasts.imageUploadError') || 'Error uploading image');
    } finally { setUploading(false); }
  };

  const onSelectDocs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) rejected.push(f.name);
      else accepted.push(f);
    }
    if (accepted.length > 0) setPendingDocs(prev => [...prev, ...accepted]);
    if (rejected.length > 0) {
      const names = rejected.length > 3 ? `${rejected.slice(0,3).join(', ')}...` : rejected.join(', ');
      setToast(t('partsEdit.toasts.docsRejected', { names }) || `Rejected: ${names}`);
    } else {
      setToast(t('partsEdit.toasts.docsReady', { count: accepted.length }) || `${accepted.length} document(s) ready to upload`);
    }
  };

  const removePendingDoc = (index: number) => {
    setPendingDocs(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedDoc = (indexOrId: number | string) => {
    // mark uploaded doc for deletion; will be removed on save
    const id = typeof indexOrId === 'string' ? indexOrId : null;
    if (id) {
      setRemovedDocIds(prev => Array.from(new Set([...prev, id])));
      return;
    }
    // if passed index, derive id from form.docs
    setForm((prev: any) => {
      const docs = prev.docs || [];
      const idx = typeof indexOrId === 'number' ? indexOrId : -1;
      if (idx < 0 || idx >= docs.length) return prev;
      const item = docs[idx];
      const docId = item && typeof item === 'object' ? item._id : String(item);
      setRemovedDocIds(prevIds => Array.from(new Set([...prevIds, docId])));
      return prev;
    });
  };

  const undoRemoveUploadedDoc = (id: string) => {
    setRemovedDocIds(prev => prev.filter(x => x !== id));
  };

  const removeDoc = (index: number) => {
    setForm((prev: any) => ({ ...prev, docs: (prev.docs || []).filter((_: any, i: number) => i !== index) }));
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonButton color={'dark'} fill={'clear'} slot={'start'} onClick={() => history.goBack()}>
            <IonIcon icon={chevronBackOutline} slot={'icon-only'} />
          </IonButton>
          <IonTitle>{id ? 'Editar repuesto' : 'Nuevo repuesto'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t('partsEdit.columns.left')}</div>
              <IonItem>
                <IonLabel position="stacked">{t('partsEdit.labels.name')}</IonLabel>
                <IonInput value={form.name} onIonChange={e => setForm({ ...form, name: e.detail.value })} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('partsEdit.labels.serial')}</IonLabel>
                <IonInput value={form.serial} onIonChange={e => setForm({ ...form, serial: e.detail.value })} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('partsEdit.labels.quantity')}</IonLabel>
                <IonInput type="number" value={form.quantity} onIonChange={e => setForm({ ...form, quantity: Number(e.detail.value) })} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('partsEdit.labels.price', { currency })}</IonLabel>
                <IonInput
                  type="text"
                  value={formatInputValue(form.price)}
                  onIonChange={e => {
                    const raw = e.detail.value ?? '';
                    const parsed = parseInputValue(String(raw));
                    setForm({ ...form, price: parsed });
                  }}
                  inputmode={currency === 'USD' ? 'decimal' : 'numeric'}
                />
                {form.price != null && (
                  <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{formatCurrency(form.price)}</div>
                )}
              </IonItem>

              <IonItem button onClick={() => setShowLotModal(true)}>
                <IonLabel>
                  <div style={{ fontSize: 12, color: '#666' }}>{t('partsEdit.labels.lot')}</div>
                  <div style={{ fontWeight: 600 }}>
                    {form.lotId && typeof form.lotId === 'object'
                      ? `${form.lotId.code || form.lotId._id} ${form.lotId.supplier ? '· ' + form.lotId.supplier : ''}`
                      : (form.lotId ? String(form.lotId) : t('partsEdit.placeholders.selectLot'))}
                  </div>
                </IonLabel>
              </IonItem>

              <IonModal isOpen={showLotModal} onDidDismiss={() => setShowLotModal(false)}>
                <IonHeader>
                  <IonToolbar>
                    <IonTitle>{t('partsEdit.lotModal.title') || 'Seleccionar lote'}</IonTitle>
                  </IonToolbar>
                </IonHeader>
                <IonContent>
                  <IonList>
                    <IonItem>
                      <IonLabel position="stacked">{t('partsEdit.lotModal.filterBySupplier') || 'Filtrar por proveedor'}</IonLabel>
                      <IonSelect value={supplierFilter} onIonChange={e => setSupplierFilter(e.detail.value)} okText={t('common.save') || 'Guardar'} cancelText={t('common.cancel') || 'Cancelar'}>
                        <IonSelectOption value="">{t('partsEdit.lotModal.all') || 'Todos'}</IonSelectOption>
                        {suppliers.map(s => (
                          <IonSelectOption key={s} value={s}>{s}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                      {filteredLots.map(l => (
                        <IonItem key={l._id} button onClick={() => { setForm({ ...form, lotId: l }); setShowLotModal(false); }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700 }}>{l.code || l._id}</div>
                          <div style={{ fontSize: 13, color: '#607D8B' }}>{l.supplier || '-'}</div>
                          <div style={{ fontSize: 12, color: '#90A4AE' }}>{(l.startDate || l.arrivalDate || l.createdAt) ? new Date(l.startDate || l.arrivalDate || l.createdAt).toLocaleDateString() : ''}</div>
                        </div>
                        <div slot="end" style={{ display: 'flex', gap: 8 }}>
                          <IonButton fill="clear" onClick={(e) => { e.stopPropagation(); history.push(`/logistics/lots/edit/${l._id}`); }}>{t('partsEdit.lotModal.edit') || 'Editar'}</IonButton>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonContent>
                <IonFooter>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
                    <IonButton onClick={() => setShowLotModal(false)} style={buttonCancel}>{t('common.cancel') || 'Cancelar'}</IonButton>
                  </div>
                </IonFooter>
              </IonModal>

              <IonItem>
                <IonLabel position="stacked">{t('partsEdit.labels.notes')}</IonLabel>
                <IonInput value={form.notes} onIonChange={e => setForm({ ...form, notes: e.detail.value })} />
              </IonItem>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <IonButton style={buttonCancel} onClick={() => history.push('/parts')}>{t('common.cancel') || 'Cancelar'}</IonButton>
                <IonButton onClick={save} disabled={loading}>{id ? t('common.save') || 'Guardar' : t('common.create') || 'Crear'}</IonButton>
              </div>
            </IonCol>

            <IonCol size="6">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t('partsEdit.columns.right')}</div>
              <div style={{ padding: 10 }}>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={onDropImage}
                  style={{ border: '2px dashed #E0E0E0', padding: 12, borderRadius: 6, marginTop: 0, textAlign: 'center' }}
                >
                  {imagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <img src={imagePreview} style={{ height: 80, borderRadius: 6 }} alt="preview" />
                      <IonButton onClick={() => { setImagePreview(null); /* remove last image id from docs */ setForm((p: any) => ({ ...p, docs: (p.docs || []).slice(0, -1) })); }} color="danger"><IonIcon icon={trashIcon} /> {t('partsEdit.actions.removeImage') || 'Eliminar'}</IonButton>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 8 }}><strong>{t('partsEdit.image.uploadHint')}</strong></div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t('partsEdit.image.formats')}</div>
                      <input ref={imageInputRef} id="part-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                      <IonButton onClick={() => imageInputRef.current?.click()}><IonIcon icon={cloudUploadOutline} /> {t('partsEdit.actions.selectImage')}</IonButton>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('partsEdit.documents.title')}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t('partsEdit.documents.hint')}</div>
                  <input ref={docsInputRef} id="parts-docs-input" type="file" accept=".pdf,.doc,.docx,.txt" multiple style={{ display: 'none' }} onChange={onSelectDocs} />
                  <IonButton onClick={() => docsInputRef.current?.click()}>{t('partsEdit.actions.selectDocuments')}</IonButton>

                  <IonList style={{ marginTop: 8 }}>
                    {(form.docs || []).map((d: any, idx: number) => {
                      const isObj = d && typeof d === 'object';
                      const docId = isObj ? (d._id || '') : String(d);
                      const displayName = isObj ? (d.originalName || d.filename || d._id) : String(d);
                      const ext = (displayName && displayName.split('.').pop()) ? displayName.split('.').pop().toUpperCase() : 'F';
                      const marked = removedDocIds.includes(String(docId));
                      return (
                        <div key={`uploaded-${String(docId)}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid #F1F6F9', borderRadius: 6, marginBottom: 6, opacity: marked ? 0.5 : 1, background: marked ? '#FFF3F3' : 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, background: marked ? '#FFEBEE' : '#ECEFF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{ext}</div>
                            <div style={{ fontSize: 14 }}>{displayName}</div>
                            {marked && <div style={{ marginLeft: 8, color: '#C62828', fontSize: 12 }}>({t('partsEdit.documents.markedForDeletion') || 'Marcado para eliminar'})</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {marked ? (
                              <IonButton fill="clear" onClick={() => undoRemoveUploadedDoc(String(docId))}>{t('common.undo') || 'Deshacer'}</IonButton>
                            ) : (
                              <IonButton fill="clear" onClick={() => removeUploadedDoc(String(docId))}><IonIcon icon={trashIcon} /></IonButton>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {pendingDocs.map((f, idx) => (
                      <div key={`pending-${f.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, border: '1px solid #F1F6F9', borderRadius: 6, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(f.name.split('.').pop() || '').toUpperCase()}</div>
                          <div style={{ fontSize: 14 }}>{f.name}</div>
                        </div>
                        <IonButton fill="clear" onClick={() => removePendingDoc(idx)}><IonIcon icon={trashIcon} /></IonButton>
                      </div>
                    ))}
                  </IonList>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast isOpen={!!toast} message={toast || ''} duration={2000} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default PartsEdit;
