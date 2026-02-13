import React, { useState } from 'react';
import { IonList, IonItem, IonNote, IonButton, IonPopover, IonIcon, IonTextarea, IonCard, IonCardHeader, IonCardContent, IonToolbar } from '@ionic/react';
import { ImageModal } from './Modals/ImageModal';
import { PDFPreviewModal } from './Modals/PDFPreviewModal';
import { chevronForwardOutline } from 'ionicons/icons';


type Props = {
  templateStructure: any | null;
  wo: any;
  pageIndex?: number;
  style?: React.CSSProperties;
  fieldStatuses?: Record<string, string>;
  fieldComments?: Record<string, string>;
  onStatusChange?: (uid: string, status: string, pageIndex: number, comment?: string) => void;
};

const TemplateReviewRenderer: React.FC<Props> = ({ templateStructure, wo, pageIndex, style, fieldStatuses, fieldComments, onStatusChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrlState, setPdfUrlState] = useState<string | null>(null);
  const [popoverOpenUid, setPopoverOpenUid] = useState<string | null>(null);
  const [popoverComment, setPopoverComment] = useState<string>('');

  const openImage = (url: string | null) => {
    if (!url) return;
    setModalUrl(url);
    setModalOpen(true);
  };

  const isImageUrl = (u: string | undefined | null) => {
    if (!u) return false;
    return /\.(png|jpe?g|webp|gif|svg|bmp)(\?|$)/i.test(u);
  };
  const isPdfUrl = (u: string | undefined | null) => {
    if (!u) return false;
    return /\.pdf(\?|$)/i.test(u);
  };
  const isDocumentUrl = (u: string | undefined | null) => {
    if (!u) return false;
    return /\.(pdf|docx?|txt|rtf|odt|xlsx?|csv)(\?|$)/i.test(u);
  };

  const openPdf = (url: string | null) => {
    if (!url) return;
    setPdfUrlState(url);
    setPdfOpen(true);
  };
  const values = (wo.data && wo.data.values) ? wo.data.values : {};
  const photos = (wo.data && wo.data.photos) ? wo.data.photos : {};
  const filesMap = (wo.data && wo.data.filesMap) ? wo.data.filesMap : {};
  const dynamicLists = (wo.data && wo.data.dynamicLists) ? wo.data.dynamicLists : {};

  const findByUidIn = (obj: any, uid: string) => {
    if (!obj) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, uid)) return obj[uid];
    const keys = Object.keys(obj || {});
    let k = keys.find(k => k === uid);
    if (k) return obj[k];
    k = keys.find(k => k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (k) return obj[k];
    // also handle case where server stored value by fieldId (shorter key) and our uid is 'fieldId-<page>-<idx>'
    k = keys.find(k => k.indexOf(uid) >= 0 || uid.indexOf(k) >= 0 || uid.startsWith(k) || uid.includes(k));
    if (k) return obj[k];
    return undefined;
  };

  const unwrapValue = (v: any): any => {
    if (v === undefined || v === null) return v;
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.map(unwrapValue).join(', ');
      if ('value' in v) return unwrapValue(v.value);
      if ('text' in v) return unwrapValue(v.text);
      if ('label' in v) return unwrapValue(v.label);
      return JSON.stringify(v);
    }
    return v;
  };

  const getValueForUid = (uid: string) => {
    let v = findByUidIn(values, uid);
    if (v !== undefined) return unwrapValue(v);
    v = findByUidIn(wo.data || {}, uid);
    if (v !== undefined) return unwrapValue(v);
    const subkeys = Object.keys(values || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (subkeys.length) return subkeys.map(sk => ({ key: sk, val: unwrapValue(values[sk]) }));
    for (const dlk of Object.keys(dynamicLists || {})) {
      const items = dynamicLists[dlk];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === 'object') {
            if (Object.prototype.hasOwnProperty.call(item, uid)) return unwrapValue(item[uid]);
            const nested = findByUidIn(item, uid);
            if (nested !== undefined) return unwrapValue(nested);
          }
        }
      }
    }
    return undefined;
  };

  const getPhotosForUid = (uid: string) => {
    let p = findByUidIn(photos, uid);
    if (p) return p;
    let f = findByUidIn(filesMap, uid);
    if (f) return f;
    const pkeys = Object.keys(photos || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (pkeys.length) return pkeys.map(k => photos[k]);
    const fkeys = Object.keys(filesMap || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (fkeys.length) return fkeys.map(k => filesMap[k]);
    return undefined;
  };

  const getFileForUid = (uid: string) => {
    let f = findByUidIn(filesMap, uid);
    if (f) return f;
    let p = findByUidIn(photos, uid);
    if (p) return p;
    const fkeys = Object.keys(filesMap || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (fkeys.length) return fkeys.map(k => filesMap[k]);
    return undefined;
  };

  const splitIntoPages = (components: any[] = []) => {
    const safeSchema = Array.isArray(components) ? components : [];
    const result: any[] = [];
    let current: any[] = [];
    for (const f of safeSchema) {
      if (f && (f.type === 'division' || f.component === 'division')) {
        result.push(current);
        current = [];
      } else {
        current.push(f);
      }
    }
    result.push(current);
    if (!result.length) result.push([]);
    return result;
  };

  if (!templateStructure || !Array.isArray(templateStructure.components)) {
    // fallback: show raw values/photos/filesMap
    if ((Object.keys(values || {}).length === 0) && (Object.keys(photos || {}).length === 0) && (Object.keys(filesMap || {}).length === 0)) {
      return <IonNote>No hay elementos para revisar.</IonNote>;
    }
    return (
      <IonList>
        {Object.keys(values || {}).map(k => (
          <IonItem key={k}><div style={{ width: '100%' }}><div style={{ fontWeight: 600 }}>{k}</div><div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{String(values[k])}</div></div></IonItem>
        ))}
        {Object.keys(photos || {}).map(k => (
          <IonItem key={k} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600 }}>{k}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <img src={photos[k]} alt={k} style={{ maxWidth: 240, maxHeight: 240, borderRadius: 6 }} />
            </div>
          </IonItem>
        ))}
          {Object.keys(filesMap || {}).map(k => {
          const f = filesMap[k];
          const name = f && (f.name || k);
          const url = f && (f.url || f);
          return (
            <IonItem key={k}><div style={{ width: '100%' }}><div style={{ fontWeight: 600 }}>{name}</div><div style={{ marginTop: 6 }}>{url ? (isDocumentUrl(url) ? (isPdfUrl(url) ? <a href="#" onClick={(e) => { e.preventDefault(); openPdf(url); }}>Ver Documento</a> : <a href={url} target="_blank" rel="noreferrer">Ver Documento</a>) : (<a href={url} target="_blank" rel="noreferrer">Abrir archivo</a>)) : (<IonNote>Sin URL</IonNote>)}</div></div></IonItem>
          );
        })}
      </IonList>
    );
  }

  const pages = splitIntoPages(templateStructure.components);

  return (
    <>
    <IonList style={style}>
      {(typeof pageIndex === 'number' ? [pages[pageIndex] || []] : pages).map((page: any[] = [], pidxOffset: number) => {
        // pidxOffset is the index within the subset; compute actual page index when a specific pageIndex is provided
        const actualPageIndex = (typeof pageIndex === 'number') ? pageIndex : pidxOffset;
        return (
          <div key={`page-${actualPageIndex}`}>
            {page.map((field: any, fidx: number) => {
            const uid = `${(field.id || 'field')}-${actualPageIndex}-${fidx}`;
            const fieldId = field && (field.id || field._id || field.key || field.name) || null;
            // Prefer direct lookup by canonical field id (server stores photos/files by id)
            const val = (fieldId && (Object.prototype.hasOwnProperty.call(values || {}, fieldId) ? values[fieldId] : undefined)) ?? getValueForUid(uid);
            const ph = (fieldId && (Object.prototype.hasOwnProperty.call(photos || {}, fieldId) ? photos[fieldId] : undefined)) ?? getPhotosForUid(uid);
            const file = (fieldId && (Object.prototype.hasOwnProperty.call(filesMap || {}, fieldId) ? filesMap[fieldId] : undefined)) ?? getFileForUid(uid);
            const dyn = (fieldId && (Object.prototype.hasOwnProperty.call(dynamicLists || {}, fieldId) ? dynamicLists[fieldId] : undefined)) || findByUidIn(dynamicLists, uid) || findByUidIn(wo.data || {}, uid);

            const renderComponent = () => {
              switch ((field.type || field.component || '').toLowerCase()) {
                case 'text':
                case 'number':
                case 'textarea':
                  if (val !== undefined && val !== null) {
                    if (Array.isArray(val)) return (<div>{val.map((it: any) => (<div key={it.key}><strong>{String(it.key).replace(uid + '-', '')}:</strong> {String(it.val)}</div>))}</div>);
                    return <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{String(val)}</div>;
                  }
                  return <IonNote>Sin valor</IonNote>;
                case 'checkbox':
                  return <div>{val ? 'Sí' : 'No'}</div>;
                case 'select':
                case 'radio':
                  return <div>{val || <IonNote>Sin valor</IonNote>}</div>;
                case 'image':
                case 'signature':
                  if (ph) {
                    if (Array.isArray(ph)) return (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {ph.map((src: any, i: number) => {
                          const url = (src && (src.url || src)) || null;
                          return url ? (
                            <img key={i} src={url} alt={`${uid}-${i}`} style={{ maxWidth: 240, maxHeight: 240, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} />
                          ) : null;
                        })}
                      </div>
                    );
                    const url = (ph && (ph.url || ph)) || null;
                    if (url) return <img src={url} alt={uid} style={{ maxWidth: 360, maxHeight: 360, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} />;
                  }
                  if (file) {
                    if (Array.isArray(file)) return (<div>{file.map((ff: any, i: number) => { const url = ff && (ff.url || ff); if (!url) return null; return <div key={i}>{isImageUrl(url) ? <img src={url} alt={`${uid}-${i}`} style={{ maxWidth: 160, maxHeight: 120, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} /> : isDocumentUrl(url) ? (isPdfUrl(url) ? <a href="#" onClick={(e) => { e.preventDefault(); openPdf(url); }}>Ver Documento</a> : <a href={url} target="_blank" rel="noreferrer">Ver Documento</a>) : <a href={url} target="_blank" rel="noreferrer">Abrir archivo</a>}</div>; })}</div>);
                    const url = file && (file.url || file);
                    if (url) return isImageUrl(url) ? <img src={url} alt={uid} style={{ maxWidth: 360, maxHeight: 360, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} /> : isDocumentUrl(url) ? (isPdfUrl(url) ? <a href="#" onClick={(e) => { e.preventDefault(); openPdf(url); }}>Ver Documento</a> : <a href={url} target="_blank" rel="noreferrer">Ver Documento</a>) : <a href={url} target="_blank" rel="noreferrer">Abrir archivo</a>;
                  }
                  return <IonNote>Sin imagen</IonNote>;
                case 'file':
                  if (file) {
                    if (Array.isArray(file)) return (<div>{file.map((ff: any, i: number) => { const url = ff && (ff.url || ff); const name = ff && (ff.name || `${uid}-${i}`); if (!url) return <div key={i}><IonNote>Sin URL</IonNote></div>; return isImageUrl(url) ? <div key={i}><img src={url} alt={name} style={{ maxWidth: 160, maxHeight: 120, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} /></div> : <div key={i}><a href={url} target="_blank" rel="noreferrer">{name}</a></div>; })}</div>);
                    const url = file && (file.url || file);
                    const name = file && (file.name || uid);
                    if (url) return isImageUrl(url) ? <img src={url} alt={name} style={{ maxWidth: 360, maxHeight: 360, borderRadius: 6, cursor: 'pointer' }} onClick={() => openImage(url)} /> : isDocumentUrl(url) ? (isPdfUrl(url) ? <a href="#" onClick={(e) => { e.preventDefault(); openPdf(url); }}>Ver Documento</a> : <a href={url} target="_blank" rel="noreferrer">Ver Documento</a>) : <a href={url} target="_blank" rel="noreferrer">{name}</a>;
                  }
                  return <IonNote>Sin archivo</IonNote>;
                case 'dynamic_list':
                  if (Array.isArray(dyn) && dyn.length > 0) return (<div>{dyn.map((it: any, i: number) => (<div key={i} style={{ padding: 8, border: '1px solid #eee', marginTop: 6 }}>{typeof it === 'object' ? Object.entries(it).map(([k, v]) => (<div key={k}><strong>{k}:</strong> {String(v)}</div>)) : String(it)}</div>))}</div>);
                  return <IonNote>Sin ítems</IonNote>;
                default:
                  if (val !== undefined && val !== null) return <div>{Array.isArray(val) ? JSON.stringify(val) : String(val)}</div>;
                  return <IonNote>Sin valor</IonNote>;
              }
            };

            const status = (fieldStatuses && fieldStatuses[uid]) || 'none';
            const color = status === 'approved' ? 'success' : status === 'approved_observations' ? 'warning' : status === 'rejected' ? 'danger' : 'medium';
            const circleColor = status === 'approved' ? '#28a745' : status === 'approved_observations' ? '#ffc107' : status === 'rejected' ? '#dc3545' : '#cfcfcf';
            return (
              <IonCard key={uid} style={{ marginBottom: 12, flexDirection: 'column', alignItems: 'flex-start' }}>
                <IonCardHeader style={{ borderBottom: '1px solid #e6e6e6', width: '100%', paddingBottom: 4, paddingTop: 4 }}>
                              <IonToolbar>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 12, background: circleColor, border: '1px solid #e6e6e6' }} />
                      <div style={{ fontWeight: 700 }}>{field.label || field.title || uid}</div>
                    </div>
                                <IonButton slot='end' size="small" fill="clear" onClick={() => { setPopoverOpenUid(uid); setPopoverComment(fieldComments && fieldComments[uid] ? fieldComments[uid] : ''); }} aria-label="Abrir opciones de estado">
                      <IonIcon icon={chevronForwardOutline} slot="icon-only" />
                    </IonButton>
                                <IonPopover isOpen={popoverOpenUid === uid} onDidDismiss={() => { setPopoverOpenUid(null); setPopoverComment(''); }}>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Comentario del revisor</div>
                        <IonTextarea autoFocus={true} style={{border: '1px solid #ccc', padding: 10, borderRadius: 8}} value={popoverComment} placeholder="Agregar comentario (opcional)" onIonInput={(e) => setPopoverComment((e as any).detail?.value || '')} rows={3} />
                        <IonButton style={{ flex: 1 }} color="success" onClick={() => { setPopoverOpenUid(null); onStatusChange && onStatusChange(uid, 'approved', actualPageIndex, popoverComment); setPopoverComment(''); }}>Aprobado</IonButton>
                        <IonButton style={{ flex: 1 }} color="warning" onClick={() => { setPopoverOpenUid(null); onStatusChange && onStatusChange(uid, 'approved_observations', actualPageIndex, popoverComment); setPopoverComment(''); }}>Aprob. con Obs.</IonButton>
                        <IonButton style={{ flex: 1 }} color="danger" onClick={() => { setPopoverOpenUid(null); onStatusChange && onStatusChange(uid, 'rejected', actualPageIndex, popoverComment); setPopoverComment(''); }}>Rechazado</IonButton>
                      </div>
                    </IonPopover>
                  </IonToolbar>
                </IonCardHeader>
                <IonCardContent style={{ marginTop: 6, width: '100%', position: 'relative', paddingTop: 24, paddingBottom: 24 }}>
                  
                  {renderComponent()}
                </IonCardContent>
                
              </IonCard>
            );
          })}
            </div>
        );
      })}
    </IonList>
    <ImageModal isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)} url={modalUrl} />
    <PDFPreviewModal isOpen={pdfOpen} onDidDismiss={() => setPdfOpen(false)} pdfUrl={pdfUrlState} />
    </>
  );
};

export default TemplateReviewRenderer;
