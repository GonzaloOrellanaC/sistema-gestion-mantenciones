import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToast, IonModal } from '@ionic/react';
import assetsApi from '../api/assets';
import * as XLSX from 'xlsx';

const AssetsBulkUpload: React.FC = () => {
  // Avoid suspending translations here so page shows immediately
  const t = (key: string, opts?: any) => (opts && opts.defaultValue) || key;
  const [fileName, setFileName] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [result, setResult] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    try {
      let parsed: any = null;
      if (ext === 'json') {
        const text = await f.text();
        parsed = JSON.parse(text);
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await f.text();
        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else if (ext === 'xls' || ext === 'xlsx') {
        const ab = await f.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        setToast({ show: true, message: 'Formato no soportado en este ejemplo' });
        return;
      }
      if (!Array.isArray(parsed)) {
        setToast({ show: true, message: 'El archivo debe contener una tabla o un array de objetos' });
        return;
      }
      setItems(parsed);
      setParsedPreview(parsed);
      setShowPreview(true);
      setResult([]);
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: 'Error leyendo archivo' });
    }
  };

  const importItems = async () => {
    if (!items.length) {
      setToast({ show: true, message: 'No hay items para importar' });
      return;
    }
    try {
      const res = await assetsApi.bulkCreate(items);
      // Normalize response
      const out: any[] = [];
      if (Array.isArray(res)) {
        // assume array of created assets
        for (let i = 0; i < res.length; i++) {
          out.push({ item: items[i] || {}, ok: true, id: res[i]._id || res[i].id });
        }
      } else if (res && Array.isArray((res as any).created)) {
        const created = (res as any).created;
        for (let i = 0; i < created.length; i++) {
          out.push({ item: items[i] || {}, ok: true, id: created[i]._id || created[i].id });
        }
      } else if (res && Array.isArray((res as any).results)) {
        for (const r of (res as any).results) out.push(r);
      } else {
        out.push({ ok: true, message: 'Importación completada', data: res });
      }
      setResult(out);
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: 'Error importando desde la API' });
    }
  };

  const loadExample = async () => {
    try {
      const res = await fetch('/files/assets_bulk_example.json');
      if (!res.ok) throw new Error('No encontrado');
      const j = await res.json();
      if (!Array.isArray(j)) {
        setToast({ show: true, message: 'Ejemplo inválido' });
        return;
      }
      setItems(j);
      setResult([]);
      setFileName('assets_bulk_example.json');
    } catch (err:any) {
      console.error(err);
      setToast({ show: true, message: 'No se pudo cargar el ejemplo desde /files' });
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0px 10px' }}>
          <IonTitle>{t('assets.bulk_title', { defaultValue: 'Carga Masiva de Activos' })}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <input
            id="file-input"
            type="file"
            accept=".json,.csv,.xls,.xlsx,.txt"
            onChange={(e:any) => handleFile(e.target.files && e.target.files[0])}
          />
          <IonButton onClick={loadExample}>Cargar Ejemplo</IonButton>
          <IonButton onClick={importItems} disabled={items.length === 0}>Importar</IonButton>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>Archivo:</strong> {fileName || '—'}
        </div>

        <div>
          <strong>Resultado:</strong>
          <div style={{ maxHeight: 300, overflow: 'auto', background: '#fff', padding: 8 }}>
            {result.length === 0 && <div>No hay resultados aún.</div>}
            {result.map((r, idx) => (
              <div key={idx} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <div><strong>{r.ok ? 'OK' : 'ERROR'}</strong> {r.ok ? `(id: ${r.id})` : ''}</div>
                <div style={{ fontSize: 13, color: '#333' }}>{r.message || ''}</div>
                <div style={{ fontSize: 12, color: '#666' }}><pre style={{ margin: 0 }}>{JSON.stringify(r.item)}</pre></div>
              </div>
            ))}
          </div>
        </div>

        <IonModal isOpen={showPreview} className="bulk-preview-modal">
          <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>Vista previa</div>
              <div>
                <IonButton onClick={() => { setShowPreview(false); }}>{'Cerrar'}</IonButton>
              </div>
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: 12 }}>
              {parsedPreview.length === 0 && <div>No hay datos para previsualizar.</div>}
              {parsedPreview.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {Object.keys(parsedPreview[0]).map((k) => (
                        <th key={k} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left', background: '#fafafa' }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(parsedPreview[0]).map((k) => (
                          <td key={k} style={{ border: '1px solid #eee', padding: 8 }}>{String(row[k] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </IonModal>

        <IonToast isOpen={toast.show} message={toast.message} duration={2500} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default AssetsBulkUpload;
