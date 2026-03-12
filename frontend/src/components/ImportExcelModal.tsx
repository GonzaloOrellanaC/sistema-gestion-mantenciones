import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButton, IonContent, IonToast, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonSpinner, IonIcon } from '@ionic/react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import * as assetsApi from '../api/assets';
import * as branchesApi from '../api/branches';
import './ImportExcelModal.css'
import { closeOutline } from 'ionicons/icons';

type Props = {
  isOpen: boolean;
  onDidDismiss: () => void;
};

const allowedExt = ['xlsx', 'xls', 'csv', 'json'];

const ImportExcelModal: React.FC<Props> = ({ isOpen, onDidDismiss }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<any>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<string | null>(null);
  const [existingBranches, setExistingBranches] = useState<string[]>([]);
  const [invalidBySection, setInvalidBySection] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setPreview(null);
    setToast({ show: false, message: '' });
    setLoading(false);
    setActivePreviewTab(null);
  }, [isOpen]);

  useEffect(() => {
    if (preview) {
      const keys = Object.keys(preview || {});
      setActivePreviewTab(keys.length ? keys[0] : null);
    } else {
      setActivePreviewTab(null);
    }
  }, [preview]);

  useEffect(() => {
    // when preview changes, fetch branches and compute invalid locations per section
    const computeInvalids = async () => {
      if (!preview) {
        setExistingBranches([]);
        setInvalidBySection({});
        return;
      }
      try {
        const brRes = await branchesApi.listBranches({ limit: 1000 });
        const existing: any[] = (brRes.items || []).map((b: any) => (b.name || '').toString().trim()).filter(Boolean);
        setExistingBranches(existing);
        const invalids: Record<string, string[]> = {} as Record<string, string[]>;
        for (const key of Object.keys(preview || {})) {
          const rows = Array.isArray(preview[key].rows) ? preview[key].rows : [];
          const fileBranches: any[] = Array.from(new Set(rows.map((r: any) => {
            if (key === 'assets') {
              return (r.branch || '').toString().trim();
            }
            return (r.location || r.branch || r.branchName || '').toString().trim();
          }).filter(Boolean)));
          const missing = fileBranches.filter((fb: string) => !existing.includes(fb));
          if (missing.length) invalids[key] = missing;
        }
        setInvalidBySection(invalids);
      } catch (e) {
        console.warn('failed loading branches for preview', e);
        setExistingBranches([]);
        setInvalidBySection({});
      }
    };
    computeInvalids();
  }, [preview]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(ext)) {
      setToast({ show: true, message: 'Archivo no permitido' });
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('file', f);
      const payloadLang = (i18n && i18n.language && String(i18n.language).toLowerCase().startsWith('en')) ? 'en' : 'es';
      fd.append('lang', payloadLang);
      const res = await api.post('/api/imports/excel', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      console.log('import response', res);
      setPreview(res.data && res.data.data ? res.data.data : res.data);
    } catch (err:any) {
      console.error('import error', err);
      setToast({ show: true, message: err?.response?.data?.message || 'Error importando archivo' });
    } finally {
      setLoading(false);
    }
  };

  const importSection = async (sectionName: string) => {
    if (!preview || !preview[sectionName]) return setToast({ show: true, message: t('importModal.no_section') });
    const rows = Array.isArray(preview[sectionName].rows) ? preview[sectionName].rows : [];
    // Branch checks: ensure at least one branch exists in org and that branch names used in file match existing branches
    try {
      const brRes = await branchesApi.listBranches({ limit: 1000 });
      const existing = (brRes.items || []).map((b: any) => (b.name || '').toString().trim()).filter(Boolean);
      if (!existing.length) return setToast({ show: true, message: t('importModal.no_branches', { defaultValue: 'Debe crear al menos una sucursal antes de importar.' }) });
      // collect location/branch names used in rows
      const fileBranches: any[] = Array.from(new Set(rows.map((r: any) => (r.location || r.branch || r.branchName || '').toString().trim()).filter(Boolean)));
      const missing: any[] = fileBranches.filter((fb: string) => !existing.includes(fb));
      if (missing.length) return setToast({ show: true, message: t('importModal.missing_branches', { defaultValue: `Las siguientes sucursales no existen: ${missing.join(', ')}` , missing: missing.join(', ') }) });
    } catch (e) {
      // if branch check fails, allow import to proceed (but it's safer to fail on backend)
      console.warn('branch check failed', e);
    }
    // Trial limits enforcement
    try {
      const org = (user as any)?.org;
      const trialEndsAt = org?.trialEndsAt ? new Date(org.trialEndsAt) : null;
      const now = new Date();
      const isTrial = trialEndsAt && trialEndsAt > now;
      if (isTrial) {
        const limits: Record<string, number> = { assets: 10, parts: 100, supplies: 100 };
        const limit = limits[sectionName] || Infinity;
        if (rows.length > limit) {
          return setToast({ show: true, message: t('importModal.trial_limit_exceeded', { defaultValue: `Periodo de prueba: máximo ${limit} ${sectionName}` }) });
        }
      }
    } catch (e) {
      // ignore auth read errors and proceed
    }
    if (!rows.length) return setToast({ show: true, message: t('importModal.no_rows') });
    setImporting(true);
    setImportResults(null);
    try {
      // Reformulación: mostrar payload y comentar llamada API
      if (sectionName === 'assets') {
        const payload = rows;
        console.log('Payload para assets:', payload);
        const res = await api.post('/api/assets/bulk-create', payload);
        setImportResults({ section: sectionName, result: res.data });
        setToast({ show: true, message: t('importModal.import_success') });
      } else if (sectionName === 'parts') {
        const payload = rows;
        console.log('Payload para parts:', payload);
        const res = await api.post('/api/parts/bulk-create', payload);
        setImportResults({ section: sectionName, result: res.data });
        setToast({ show: true, message: t('importModal.import_success') });
      } else if (sectionName === 'supplies') {
        const payload = rows;
        console.log('Payload para supplies:', payload);
        const res = await api.post('/api/supplies/bulk-create', payload);
        setImportResults({ section: sectionName, result: res.data });
        setToast({ show: true, message: t('importModal.import_success') });
      }
    } catch (err:any) {
      console.error('importSection error', err);
      setToast({ show: true, message: t('importModal.import_error') });
    } finally {
      setImporting(false);
    }
  };

  const importAll = async () => {
    if (!preview) return setToast({ show: true, message: t('importModal.no_preview') });
    // If in trial, enforce per-section limits before starting
    try {
      // Branch existence & trial limits enforcement
      const brRes = await branchesApi.listBranches({ limit: 1000 });
      const existing = (brRes.items || []).map((b: any) => (b.name || '').toString().trim()).filter(Boolean);
      if (!existing.length) return setToast({ show: true, message: t('importModal.no_branches', { defaultValue: 'Debe crear al menos una sucursal antes de importar.' }) });

      const org = (user as any)?.org;
      const trialEndsAt = org?.trialEndsAt ? new Date(org.trialEndsAt) : null;
      const now = new Date();
      const isTrial = trialEndsAt && trialEndsAt > now;
      if (isTrial) {
        const limits: Record<string, number> = { assets: 10, parts: 100, supplies: 100 };
        for (const k of Object.keys(preview || {})) {
          const rows = Array.isArray(preview[k].rows) ? preview[k].rows : [];
          // check branch names
          const fileBranches: any[] = Array.from(new Set(rows.map((r: any) => (r.location || r.branch || r.branchName || '').toString().trim()).filter(Boolean)));
          const missing: any[] = fileBranches.filter((fb: string) => !existing.includes(fb));
          if (missing.length) return setToast({ show: true, message: t('importModal.missing_branches', { defaultValue: `Las siguientes sucursales no existen: ${missing.join(', ')}`, missing: missing.join(', ') }) });

          const limit = limits[k] || Infinity;
          if (rows.length > limit) return setToast({ show: true, message: t('importModal.trial_limit_exceeded', { defaultValue: `Periodo de prueba: máximo ${limit} ${k}` }) });
        }
      }
    } catch (e) {
      // ignore and proceed
    }
    setImporting(true);
    setImportResults({});
    try {
      const keys = Object.keys(preview || {});
      const aggregated: any = {};
      for (const k of keys) {
        // await each to avoid overwhelming the server
        // eslint-disable-next-line no-await-in-loop
        await importSection(k);
        aggregated[k] = importResults || null;
      }
      setImportResults(aggregated);
      setToast({ show: true, message: t('importModal.import_success') });
    } catch (err:any) {
      console.error('importAll error', err);
      setToast({ show: true, message: t('importModal.import_error') });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) onFile(f);
    // reset input
    (e.target as any).value = null;
  };

  const downloadJson = (sectionName?: string) => {
    const data = sectionName && preview && preview[sectionName] ? preview[sectionName] : preview;
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_${sectionName || 'data'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadExample = () => {
    const wb = XLSX.utils.book_new();

    const assetsExample = [
      { name: 'Generador Diesel', code: 'GEN-001', brand: 'Acme', model: 'A1', location: 'Bodega Central' },
    ];
    const partsExample = [
      { name: 'Filtro', sku: 'FILT-001', quantity: 10, unit: 'pcs' },
    ];
    const suppliesExample = [
      { name: 'Aceite 20W', sku: 'OIL-20W', unit: 'liters', quantity: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetsExample), 'assets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partsExample), 'parts');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliesExample), 'supplies');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejemplo_importacion.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} className="import-excel-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{marginLeft: 10}}>{t('importModal.title', { defaultValue: 'Importar Excel / CSV' })}</IonTitle>
          <div slot='end' style={{ marginLeft: 'auto', marginRight: 8 }}>
            <IonButton fill="clear" onClick={onDidDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              style={{ border: '2px dashed #ddd', padding: 20, textAlign: 'center', borderRadius: 6 }}
            >
                  {loading ? <div style={{ padding: 24 }}><IonSpinner /></div> : (
                <div>
                  <div style={{ marginBottom: 8 }}>{t('importModal.dragDrop', { defaultValue: 'Arrastra el archivo aquí o' })}</div>
                  <div style={{ marginBottom: 8 }}>
                    <input type="file" accept=".xlsx,.xls,.csv,.json" onChange={handleSelect} />
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>{t('importModal.allowedFormats', { defaultValue: 'Formatos permitidos: .xlsx .xls .csv .json' })}</div>
                </div>
              )}
            </div>
          </div>
          {/* language selection removed - modal uses app language from settings */}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <IonButton onClick={downloadExample}>{t('importModal.download_example', { defaultValue: 'Descargar Ejemplo' })}</IonButton>
        </div>

        {preview && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            </div>
            {/* import buttons moved below preview table */}
            <div style={{ maxHeight: '60vh', overflow: 'auto', background: '#fff', padding: 8 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {Object.keys(preview || {}).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActivePreviewTab(k)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: k === activePreviewTab ? '1px solid var(--ion-color-primary)' : '1px solid #ddd',
                      background: k === activePreviewTab ? 'rgba(33,150,243,0.06)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Table for active tab */}
              <div style={{maxHeight: 'calc(100vh - 550px)', overflowY: 'auto'}}>
                {activePreviewTab ? (() => {
                const section = preview[activePreviewTab];
                const headers = (section && section.headers && Array.isArray(section.headers) && section.headers.length)
                  ? section.headers.map((h:any) => ({ key: h.key, label: h.label || h.key }))
                  : (section && Array.isArray(section.rows) && section.rows.length)
                    ? Object.keys(section.rows[0]).map((k:any) => ({ key: k, label: k }))
                    : [];
                const rows = (section && Array.isArray(section.rows)) ? section.rows : [];
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {headers.map((h:any) => (
                            <th key={h.key} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e6e6e6' }}>{h.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r:any, ri:number) => (
                          <tr key={ri} style={{ background: ri % 2 ? '#fafafa' : 'transparent' }}>
                            {headers.map((h:any) => {
                              const cell = (r[h.key] !== undefined && r[h.key] !== null) ? String(r[h.key]) : '';
                              // Unificar coloreado para branch/location/branchName
                              if (['branch', 'location', 'branchName'].includes(h.key)) {
                                const isValid = existingBranches.includes((cell || '').toString().trim());
                                return (
                                  <td key={h.key} style={{ padding: '8px', borderBottom: '1px solid #f1f1f1', color: cell ? (isValid ? '#388e3c' : '#d32f2f') : undefined, fontWeight: cell ? 500 : undefined }}>
                                    {cell}
                                  </td>
                                );
                              }
                              return <td key={h.key} style={{ padding: '8px', borderBottom: '1px solid #f1f1f1' }}>{cell}</td>;
                            })}
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={headers.length} style={{ padding: 12, color: '#666' }}>{t('importModal.no_rows', { defaultValue: 'No rows' })}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })() : (
                <div style={{ padding: 12, color: '#666' }}>{t('importModal.no_preview', { defaultValue: 'No preview available' })}</div>
              )}
              </div>

            {/* Navigation controls: Prev / Next / Sheet select */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 18 }}>
              <button
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                onClick={() => {
                  const keys = Object.keys(preview || {});
                  const idx = keys.indexOf(activePreviewTab || '');
                  if (idx > 0) setActivePreviewTab(keys[idx - 1]);
                }}
                disabled={!activePreviewTab || Object.keys(preview || {}).indexOf(activePreviewTab) <= 0}
              >
                {t('importModal.prev', { defaultValue: 'Prev' })}
              </button>
              <button
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                onClick={() => {
                  const keys = Object.keys(preview || {});
                  const idx = keys.indexOf(activePreviewTab || '');
                  if (idx >= 0 && idx < keys.length - 1) setActivePreviewTab(keys[idx + 1]);
                }}
                disabled={!activePreviewTab || Object.keys(preview || {}).indexOf(activePreviewTab) === Object.keys(preview || {}).length - 1}
              >
                {t('importModal.next', { defaultValue: 'Next' })}
              </button>

              <select value={activePreviewTab || ''} onChange={(e) => setActivePreviewTab(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
                {Object.keys(preview || {}).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Import buttons (sheet / all) placed below preview */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <IonButton
                onClick={() => { if (activePreviewTab) importSection(activePreviewTab); }}
                disabled={importing || !activePreviewTab || !!(invalidBySection[activePreviewTab || ''] && invalidBySection[activePreviewTab || ''].length)}
              >
                {t('importModal.import_sheet', { defaultValue: 'Import Sheet' })}
              </IonButton>
              <IonButton
                color="primary"
                onClick={() => importAll()}
                disabled={importing || Object.keys(invalidBySection || {}).some(k => (invalidBySection[k] || []).length > 0)}
              >
                {t('importModal.import_all', { defaultValue: 'Import All' })}
              </IonButton>
              {/* show invalid info */}
              {Object.keys(invalidBySection || {}).length > 0 && (
                <div style={{ color: '#b00020', fontSize: 13 }}>
                  {t('importModal.invalid_locations_present', { defaultValue: 'Hay ubicaciones inválidas en el archivo:' })}
                  <div style={{ marginTop: 4 }}>
                    {Object.entries(invalidBySection).map(([section, vals]) => (
                      vals && vals.length ? <div key={section}><strong>{section}:</strong> {vals.join(', ')}</div> : null
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
            {importing && <div style={{ marginTop: 8 }}>{t('importModal.importing', { defaultValue: 'Importing...' })}</div>}
            {importResults && (
              <div style={{ marginTop: 8, background: '#fafafa', padding: 8 }}>
                <strong>{t('importModal.import_results', { defaultValue: 'Import Results' })}</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(importResults, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        <IonList style={{ marginTop: 5 }}>
          <IonItem>
            <IonLabel>{t('importModal.headers_note', { defaultValue: 'Nota: Los encabezados se mapearán automáticamente (Español/Inglés).' })}</IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>{t('importModal.types_note', { defaultValue: 'Importación válida para: Activos, Repuestos e Insumos.' })}</IonLabel>
          </IonItem>
        </IonList>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonModal>
  );
};

export default ImportExcelModal;
