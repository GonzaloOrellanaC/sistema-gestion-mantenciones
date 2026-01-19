import React, { useMemo, useState, useRef, useEffect } from 'react';
import { IonCard, IonCardContent, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonModal, IonToolbar, IonTitle, IonHeader, IonIcon, IonRadio, IonItem, IonCheckbox } from '@ionic/react';
import { close } from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import SignatureModal from '../modals/SignatureModal';
import Columns from './Columns';
import TextField from './fields/TextField';
import TextareaField from './fields/TextareaField';
import SelectField from './fields/SelectField';
import RadioField from './fields/RadioField';
import CheckboxField from './fields/CheckboxField';
import NumberField from './fields/NumberField';
import ImageField from './fields/ImageField';
import FileField from './fields/FileField';
import GeoField from './fields/GeoField';
import SignatureField from './fields/SignatureField';
import DynamicListField from './fields/DynamicListField';
import DateField from './fields/DateField';
import './fields/field.css';

type Field = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  pageTitle?: string;
  children?: Field[][];
};

const FormRenderer: React.FC<{ schema: Field[]; showSaveButton?: boolean; onSave?: (payload: any) => void; onProgress?: (percent: number) => void; onRegisterSave?: (fn: () => void) => void; initialData?: any; onFieldBlur?: (snapshot: any) => void }> = ({ schema, showSaveButton, onSave, onProgress, onRegisterSave, initialData, onFieldBlur }) => {
  // split schema into pages by 'division' fields and collect page titles
  // NOTE: a division's `pageTitle` should be placed on the page that precedes the division
  const { pages, pageTitles } = useMemo(() => {
    const safeSchema = Array.isArray(schema) ? schema : ([] as Field[]);
    if (!Array.isArray(schema)) console.warn('FormRenderer: schema is not an array, falling back to empty array', schema);
    const result: Field[][] = [];
    const titles: (string | undefined)[] = [];
    let current: Field[] = [];
    for (const f of safeSchema) {
      if (f.type === 'division') {
        // end current page and assign this division's pageTitle to that page (if any)
        const title = (f.pageTitle && f.pageTitle.length > 0) ? f.pageTitle : undefined;
        // push the page that just finished
        result.push(current);
        // only assign title if the page had content; otherwise keep undefined
        titles.push(current.length > 0 ? title : undefined);
        current = [];
      } else {
        current.push(f);
      }
    }
    // push the final page (there is no subsequent division so no title)
    result.push(current);
    titles.push(undefined);
    // ensure at least one page
    if (!result.length) {
      result.push([]);
      titles.push(undefined);
    }
    return { pages: result, pageTitles: titles };
  }, [schema]);

  const [activeIndex, setActiveIndex] = useState(0);
  // photos previews per field id
  const [photos, setPhotos] = useState<Record<string, string>>({});
  // generic values per-field (text/select/radio etc.)
  const [values, setValues] = useState<Record<string, any>>({});
  // file attachments (documents) per field id
  const [filesMap, setFilesMap] = useState<Record<string, { name: string; url?: string }>>({});
  // geo locations per field id
  const [locations, setLocations] = useState<Record<string, { lat: number; lon: number; alt?: number | null }>>({});
  // camera modal state
  const [cameraOpenFor, setCameraOpenFor] = useState<string | null>(null);
  const [signatureOpenFor, setSignatureOpenFor] = useState<string | null>(null);
  const [dynamicLists, setDynamicLists] = useState<Record<string, Array<{ type: 'text' | 'image'; value: string; name?: string }>>>({});
  // inline dynamic_list controls (per-uid)
  const [showAddTextFor, setShowAddTextFor] = useState<Record<string, boolean>>({});
  const [showAddImageFor, setShowAddImageFor] = useState<Record<string, boolean>>({});
  const [addTextValue, setAddTextValue] = useState<Record<string, string>>({});
  const [addImagePreview, setAddImagePreview] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // when modal opens and stream is available, bind to video
    if (cameraOpenFor) {
      const setVideoSrc = async () => {
        try {
          if (streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current as MediaStream;
            await videoRef.current.play();
          }
        } catch (e) {
          // ignore play errors
        }
      };
      setVideoSrc();
    } else {
      // ensure stream stopped when modal closed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      // cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpenFor]);

  // populate internal state from initialData when provided (restore from DB or backup)
  useEffect(() => {
    if (!initialData) return;
    try {
      const d = initialData as any;
      if (d.values) setValues(d.values);
      if (d.photos) setPhotos(d.photos);
      if (d.filesMap) setFilesMap(d.filesMap);
      if (d.locations) setLocations(d.locations);
      if (d.dynamicLists) setDynamicLists(d.dynamicLists);
    } catch (e) {
      // ignore
    }
  }, [initialData]);

  // compute progress based on filled components
  useEffect(() => {
    try {
      let total = 0;
      let filled = 0;

      pages.forEach((page, pidx) => {
        page.forEach((field, fidx) => {
          const uid = `${field.id || 'field'}-${pidx}-${fidx}`;
          if (field.type === 'division') return;
          if (field.type === 'columns') {
            // count children as separate inputs
            const children = (field as any).children || [];
            const childCount = children.flat().length;
            total += childCount;
            // consider columns filled if any internal state key starts with uid-
            const anyInnerFilled = Object.keys(values).some(k => k.startsWith(`${uid}-`) && values[k] !== undefined && values[k] !== '')
              || Object.keys(photos).some(k => k.startsWith(`${uid}-`) && photos[k])
              || Object.keys(filesMap).some(k => k.startsWith(`${uid}-`) && filesMap[k])
              || Object.keys(locations).some(k => k.startsWith(`${uid}-`) && locations[k])
              || Object.keys(dynamicLists).some(k => k.startsWith(`${uid}-`) && (dynamicLists as any)[k] && (dynamicLists as any)[k].length > 0);
            if (anyInnerFilled) filled += childCount; // attribute as filled (simple heuristic)
          } else {
            total += 1;
            const hasValue = (values && values[uid] !== undefined && values[uid] !== '')
              || !!photos[uid]
              || !!filesMap[uid]
              || !!locations[uid]
              || ((dynamicLists[uid] || []).length > 0);
            if (hasValue) filled += 1;
          }
        });
      });

      const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
      if (typeof onProgress === 'function') onProgress(percent);
    } catch (e) {
      // ignore
    }
  // dependencies: any state that represents filled data
  }, [values, photos, filesMap, locations, dynamicLists, pages, onProgress]);

  // expose a save trigger to parent so header save can call it
  useEffect(() => {
    if (typeof onRegisterSave === 'function') {
      onRegisterSave(() => {
        if (typeof onSave === 'function') onSave({ values, photos, filesMap, locations, dynamicLists });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSave, onSave, values, photos, filesMap, locations, dynamicLists]);

  // Helpers for file/image handling and camera
  const openCamera = async (uid: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraOpenFor(uid);
    } catch (e) {
      // still open modal (fallback UI may allow canvas capture)
      setCameraOpenFor(uid);
    }
  };

  const handleFileSelected: any = (uid: string, f: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (f.type.startsWith('image/')) {
        const newPhotos = { ...photos, [uid]: data };
        setPhotos(prev => ({ ...prev, [uid]: data }));
        if (onFieldBlur) onFieldBlur({ values, photos: newPhotos, filesMap, dynamicLists, locations });
      } else {
        // store non-image files as base64 as well (for local backup)
        const newFiles = { ...filesMap, [uid]: { name: f.name, url: data } };
        setFilesMap(prev => ({ ...prev, [uid]: { name: f.name, url: data } }));
        if (onFieldBlur) onFieldBlur({ values, photos, filesMap: newFiles, dynamicLists, locations });
      }
    };
    reader.readAsDataURL(f);
  };

  const handleDynamicFileSelected = (uid: string, f: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const nextList = [...(dynamicLists[uid] || []), { type: 'image', value: data, name: f.name }];
      setDynamicLists((prev: any) => ({ ...prev, [uid]: nextList }));
      if (onFieldBlur) onFieldBlur({ values, photos, filesMap, dynamicLists: { ...dynamicLists, [uid]: nextList }, locations });
    };
    reader.readAsDataURL(f);
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* compact pagination control top-right: < 1/3 > */}
        {pages.length > 1 && (
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setActiveIndex(0)}
              disabled={activeIndex === 0}
              title="Ir a primera página"
              aria-label="Ir a primera página"
              style={{
                minWidth: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: '#ECEFF1',
                color: '#455A64',
                cursor: activeIndex === 0 ? 'default' : 'pointer',
                fontWeight: 700,
                opacity: activeIndex === 0 ? 0.5 : 1
              }}
            >{`<<`}</button>

            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              title="Página anterior"
              aria-label="Página anterior"
              style={{
                minWidth: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: '#ECEFF1',
                color: '#455A64',
                cursor: activeIndex === 0 ? 'default' : 'pointer',
                fontWeight: 700,
                opacity: activeIndex === 0 ? 0.5 : 1
              }}
            >{`<`}</button>

            <div style={{ padding: '0 8px', fontWeight: 700, color: '#37474F' }}>{`${activeIndex + 1}/${pages.length}`}</div>

            <button
              onClick={() => setActiveIndex(Math.min(pages.length - 1, activeIndex + 1))}
              disabled={activeIndex === pages.length - 1}
              title="Página siguiente"
              aria-label="Página siguiente"
              style={{
                minWidth: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: '#ECEFF1',
                color: '#455A64',
                cursor: activeIndex === pages.length - 1 ? 'default' : 'pointer',
                fontWeight: 700,
                opacity: activeIndex === pages.length - 1 ? 0.5 : 1
              }}
            >{`>`}</button>

            <button
              onClick={() => setActiveIndex(pages.length - 1)}
              disabled={activeIndex === pages.length - 1}
              title="Ir a última página"
              aria-label="Ir a última página"
              style={{
                minWidth: 34,
                height: 34,
                borderRadius: 6,
                border: 'none',
                background: '#ECEFF1',
                color: '#455A64',
                cursor: activeIndex === pages.length - 1 ? 'default' : 'pointer',
                fontWeight: 700,
                opacity: activeIndex === pages.length - 1 ? 0.5 : 1
              }}
            >{`>>`}</button>
          </div>
        )}

        <Swiper
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          initialSlide={0}
          slidesPerView={1}
          spaceBetween={8}
          onSwiper={(s) => {
            // if pagination buttons change activeIndex we need to move swiper
            // We'll watch activeIndex via effect by using a small trick below (attach to DOM via data-attr)
          }}
        >
          {pages.map((page, pidx) => (
            <SwiperSlide key={pidx}>
              <div style={{marginTop: 50, height: 'calc(100vh - 165px)', overflowY: 'auto' }}>
                {/* Page title from division.field.pageTitle if provided */}
                {pageTitles && pageTitles[pidx] && pageTitles[pidx].length > 0 && (
                  <div style={{ padding: '8px 16px', fontSize: '1.1rem', fontWeight: 700, color: '#263238' }}>{pageTitles[pidx]}</div>
                )}
                {page.map((field, fidx) => {
                    const uid = `${field.id || 'field'}-${pidx}-${fidx}`;
                    return (
                        <IonCard key={uid} style={{ cursor: 'default', marginBottom: 16 }}>
                            <IonCardContent>
                            {field.type !== 'radio' && (
                              <IonLabel style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#37474F', marginBottom: 6 }}>{field.label} {field.required && <span style={{ color: '#E53935' }}>*</span>}</IonLabel>
                            )}
                            {field.type === 'text' && (
                              <TextField field={field as any} uid={uid} values={values} setValues={setValues} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'textarea' && (
                              <TextareaField field={field as any} uid={uid} values={values} setValues={setValues} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'select' && (
                              <SelectField field={field as any} uid={uid} values={values} setValues={setValues} photos={photos} filesMap={filesMap} dynamicLists={dynamicLists} locations={locations} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'radio' && (
                                <RadioField field={field as any} uid={uid} values={values} setValues={setValues} photos={photos} filesMap={filesMap} dynamicLists={dynamicLists} locations={locations} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'geo' && (
                                <GeoField field={field as any} uid={uid} locations={locations} setLocations={setLocations} onFieldBlur={onFieldBlur} />
                            )}
                            {(field.type === 'image' || field.type === 'photo') && (
                              <ImageField field={field as any} uid={uid} photos={photos} openCamera={openCamera} onFileSelected={handleFileSelected} />
                            )}
                            {field.type === 'file' && (
                              <FileField field={field as any} uid={uid} onFileSelected={handleFileSelected} filesMap={filesMap} onFieldBlur={onFieldBlur} values={values} photos={photos} dynamicLists={dynamicLists} locations={locations} />
                            )}
                            {field.type === 'date' && (
                              <DateField field={field as any} uid={uid} values={values} setValues={setValues} photos={photos} filesMap={filesMap} dynamicLists={dynamicLists} locations={locations} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'dynamic_list' && (
                              <DynamicListField field={field as any} uid={uid} dynamicLists={dynamicLists} setDynamicLists={setDynamicLists} onFileSelected={handleDynamicFileSelected} onFieldBlur={onFieldBlur} values={values} photos={photos} filesMap={filesMap} locations={locations} />
                            )}
                            {field.type === 'columns' && (
                              <div style={{ width: '100%' }}>
                                <Columns
                                  uidBase={uid}
                                  columns={(field as any).children || [[], []]}
                                  renderField={(innerField: any, base: string, idx: number) => {
                                    // reuse the same rendering logic for inner components
                                    const innerUid = `${uid}-${base}-${idx}`;
                                    // prevent columns nesting
                                    if (innerField.type === 'columns') {
                                      return <div style={{ color: '#B0BEC5' }}>Componente "columns" anidado no permitido</div>;
                                    }

                                    // replicate minimal rendering for supported inner types
                                    switch (innerField.type) {
                                      case 'text':
                                        return <IonInput className="input-field" placeholder={innerField.placeholder} value={values[innerUid] || ''} onIonChange={e => setValues(prev => ({ ...prev, [innerUid]: e.detail.value }))} onIonBlur={() => onFieldBlur && onFieldBlur({ values, photos, filesMap, dynamicLists, locations })} />;
                                      case 'textarea':
                                        return <IonTextarea className="input-field" rows={3} placeholder={innerField.placeholder} value={values[innerUid] || ''} onIonChange={e => setValues(prev => ({ ...prev, [innerUid]: e.detail.value }))} onIonBlur={() => onFieldBlur && onFieldBlur({ values, photos, filesMap, dynamicLists, locations })} />;
                                      case 'select':
                                        return <IonSelect interface="popover" placeholder="Seleccionar opción" className="input-field" value={values[innerUid]} onIonChange={e => { const v = e.detail.value; setValues(prev => ({ ...prev, [innerUid]: v })); if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [innerUid]: v }, photos, filesMap, dynamicLists, locations }); }}>{(innerField.options || []).map((opt: string, i: number) => <IonSelectOption key={i} value={opt}>{opt}</IonSelectOption>)}</IonSelect>;
                                      case 'radio':
                                        return (
                                          <IonItem lines="none" button={true} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', paddingLeft: 0, cursor: 'pointer' }} onClick={() => { const next = !values?.[innerUid]; setValues && setValues(prev => ({ ...(prev || {}), [innerUid]: next })); if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [innerUid]: next }, photos, filesMap, dynamicLists, locations }); }}>
                                            <IonLabel style={{ fontWeight: 600 }}>{innerField.label}</IonLabel>
                                            <IonRadio slot="end" {...({ checked: !!values?.[innerUid] } as any)} />
                                          </IonItem>
                                        );
                                      case 'checkbox':
                                        return (
                                          <IonItem lines="none" button={true} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', paddingLeft: 0, cursor: 'pointer' }} onClick={() => { const next = !values?.[innerUid]; setValues && setValues(prev => ({ ...(prev || {}), [innerUid]: next })); if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [innerUid]: next }, photos, filesMap, dynamicLists, locations }); }}>
                                            <IonLabel style={{ fontWeight: 600 }}>{innerField.label}</IonLabel>
                                            <IonCheckbox slot="end" {...({ checked: !!values?.[innerUid] } as any)} />
                                          </IonItem>
                                        );
                                      case 'number':
                                        return <IonInput className="input-field" placeholder={innerField.placeholder} type="number" value={values[innerUid] || ''} onIonChange={e => { const v = e.detail.value; setValues(prev => ({ ...prev, [innerUid]: v })); if (onFieldBlur) onFieldBlur({ values: { ...(values || {}), [innerUid]: v }, photos, filesMap, dynamicLists, locations }); }} />;
                                      case 'geo':
                                        return (
                                          <div>
                                            <IonButton fill={'clear'} className="pill-button" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E3F2FD', color: '#0277BD', borderRadius: 20 }} onClick={() => {
                                              const uidLocal = innerUid;
                                              if (!('geolocation' in navigator)) {
                                                alert('Geolocalización no disponible en este navegador');
                                                return;
                                              }
                                              navigator.geolocation.getCurrentPosition((pos) => {
                                                const lat = pos.coords.latitude;
                                                const lon = pos.coords.longitude;
                                                const alt = pos.coords.altitude !== null ? pos.coords.altitude : null;
                                                setLocations(prev => ({ ...prev, [uidLocal]: { lat, lon, alt } }));
                                              }, (err) => {
                                                console.error('geo err', err);
                                                alert('No fue posible obtener la ubicación');
                                              }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 });
                                            }}>
                                              <span style={{ fontSize: 18 }}>📍</span>
                                              <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Obtener ubicación</span>
                                              <strong>Actualizar</strong>
                                            </IonButton>
                                            {locations[innerUid] && (
                                              <div style={{ marginTop: 8, fontSize: 13, color: '#37474F' }}>
                                                <div>Lat: {locations[innerUid].lat.toFixed(6)}</div>
                                                <div>Lon: {locations[innerUid].lon.toFixed(6)}</div>
                                                {locations[innerUid].alt !== null && typeof locations[innerUid].alt !== 'undefined' && <div>Alt: {locations[innerUid].alt?.toFixed(2)} m</div>}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      case 'date':
                                        return (
                                          <DateField field={innerField as any} uid={innerUid} values={values} setValues={setValues} />
                                        );
                                      case 'image':
                                      case 'photo':
                                        return (
                                          /* Add ImageField code here */
                                          <ImageField
                                            field={innerField}
                                            uid={innerUid}
                                            photos={photos}
                                            openCamera={openCamera}
                                            onFileSelected={handleFileSelected}
                                          />
                                        );
                                      case 'file':
                                        return (
                                          <div style={{ width: '100%' }}>
                                            <input accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} id={`doc-input-${innerUid}`} type="file" onChange={e => {
                                              const f = e.target.files && e.target.files[0];
                                              if (!f) return;
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const data = reader.result as string;
                                                setFilesMap(prev => ({ ...prev, [innerUid]: { name: f.name, url: data } }));
                                              };
                                              reader.readAsDataURL(f);
                                            }} />
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                              <IonButton fill={'clear'} className="pill-button" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E3F2FD', color: '#0277BD', borderRadius: 20 }} onClick={() => document.getElementById(`doc-input-${innerUid}`)?.click()}>
                                                <strong>Adjuntar documento</strong>
                                              </IonButton>
                                              {filesMap[innerUid] && (
                                                <div style={{ fontSize: 13, color: '#37474F' }}>
                                                  <div style={{ fontWeight: 600 }}>{filesMap[innerUid].name}</div>
                                                  {filesMap[innerUid].url && <a href={filesMap[innerUid].url} target="_blank" rel="noreferrer">Ver / Descargar</a>}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      case 'signature':
                                        return (
                                          <div>
                                            <div style={{ width: '100%', height: 120, borderRadius: 8, border: '1px dashed #ECEFF1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {values[innerUid] ? (
                                                <img src={values[innerUid]} alt="signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                              ) : (
                                                <div style={{ color: '#90A4AE', fontWeight: 600 }}>Firmar aquí</div>
                                              )}
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                              <IonButton onClick={() => setSignatureOpenFor(innerUid)}>Abrir firma</IonButton>
                                            </div>
                                          </div>
                                        );
                                      case 'dynamic_list':
                                        // nested dynamic_list inside columns - render existing items vertically but do NOT allow modal
                                        return (
                                          <div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                              {(dynamicLists[innerUid] || []).map((it, i) => (
                                                <div key={i} style={{ border: '1px solid #ECEFF1', padding: 12, borderRadius: 8, background: '#fff', width: '100%' }}>
                                                  {it.type === 'text' ? <div>{it.value}</div> : <img src={it.value} style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain' }} alt={it.name || 'img'} />}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      default:
                                        return <div style={{ color: '#B0BEC5' }}>Tipo `{innerField.type}` no soportado en columns</div>;
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {field.type === 'number' && (
                              <NumberField field={field as any} uid={uid} values={values} setValues={setValues} photos={photos} filesMap={filesMap} dynamicLists={dynamicLists} locations={locations} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'checkbox' && (
                              <CheckboxField field={field as any} uid={uid} values={values} setValues={setValues} photos={photos} filesMap={filesMap} dynamicLists={dynamicLists} locations={locations} onFieldBlur={onFieldBlur} />
                            )}
                            {field.type === 'signature' && (
                                <SignatureField field={field as any} uid={uid} values={values} openSignature={(u: string) => setSignatureOpenFor(u)} />
                            )}
                            </IonCardContent>
                        </IonCard>
                    )})}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Camera modal (fullscreen) */}
        <IonModal isOpen={!!cameraOpenFor} className="camera-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Tomar Foto</IonTitle>
              <div style={{ marginLeft: 'auto', marginRight: 8 }}>
                <button onClick={() => setCameraOpenFor(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <IonIcon icon={close} />
                </button>
              </div>
            </IonToolbar>
          </IonHeader>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <video ref={videoRef} style={{ maxWidth: '100%', maxHeight: '100%' }} playsInline />
            </div>
            <div style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <IonButton onClick={async () => {
                const fieldId = cameraOpenFor;
                if (!fieldId) return;
                const video = videoRef.current;
                if (!video) return;
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth || 640;
                  canvas.height = video.videoHeight || 480;
                  const ctx = canvas.getContext('2d');
                  if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                  const newPhotos = { ...photos, [fieldId]: dataUrl };
                  setPhotos(prev => ({ ...prev, [fieldId]: dataUrl }));
                  if (onFieldBlur) onFieldBlur({ values, photos: newPhotos, filesMap, dynamicLists, locations });
                } catch (e) {
                  console.error('capture err', e);
                } finally {
                  // close modal and stop stream
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                  }
                  setCameraOpenFor(null);
                }
              }}>Capturar</IonButton>
              <IonButton fill="outline" onClick={() => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraOpenFor(null); }}>Cancelar</IonButton>
            </div>
          </div>
        </IonModal>
        
        {/* Signature modal */}
        <SignatureModal isOpen={!!signatureOpenFor} onClose={() => setSignatureOpenFor(null)} onSave={(dataUrl) => {
            if (signatureOpenFor) {
              const newValues = { ...(values || {}), [signatureOpenFor]: dataUrl };
              setValues(prev => ({ ...prev, [signatureOpenFor]: dataUrl }));
              setSignatureOpenFor(null);
              if (onFieldBlur) onFieldBlur({ values: newValues, photos, filesMap, dynamicLists, locations });
            }
        }} />
      </div>

      {/* Sync pagination button clicks with Swiper via a small effect */}
      <SyncSwiper activeIndex={activeIndex} pagesCount={pages.length} />

      {/* Guardar button shown on last page when requested */}
      {showSaveButton && activeIndex === pages.length - 1 && (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
          <IonButton onClick={() => {
            if (typeof onSave === 'function') {
              onSave({ values, photos, filesMap, locations, dynamicLists });
            }
          }}>
            Guardar
          </IonButton>
        </div>
      )}
    </div>
  );
};

// Helper component that finds the swiper instance on the page and slides to activeIndex when it changes
const SyncSwiper: React.FC<{ activeIndex: number; pagesCount: number }> = ({ activeIndex }) => {
  React.useEffect(() => {
    try {
      // Swiper attaches itself to .swiper-container elements; find first and call API
      const container = document.querySelector('.swiper') as any;
      if (container && container.swiper && typeof container.swiper.slideTo === 'function') {
        container.swiper.slideTo(activeIndex);
      }
    } catch (e) {
      // ignore
    }
  }, [activeIndex]);
  return null;
};

export default FormRenderer;
