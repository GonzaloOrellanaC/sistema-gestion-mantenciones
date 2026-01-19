import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonText, IonList, IonItem, IonGrid, IonRow, IonCol, IonToolbar, IonIcon } from '@ionic/react';
import * as templatesApi from '../api/templates';
import { arrowBackOutline } from 'ionicons/icons';

type Params = { id: string };

const renderFieldPreview = (f: any) => {
  if (!f) return null;
  switch (f.type) {
    case 'text':
    case 'number':
      return <div className="simulated-input">{f.label || f.placeholder || ''}</div>;
    case 'textarea':
      return <div className="simulated-textarea">{f.placeholder || ''}</div>;
    case 'checkbox':
      return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> <div>{f.label}</div></div>;
    case 'select':
      return <div style={{ padding: 8 }}><select disabled style={{ width: '100%' }}><option>{(f.options && f.options[0]) || 'Opción'}</option></select></div>;
    case 'image':
      return <div className="simulated-image-placeholder">Imagen</div>;
    case 'dynamic_list':
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{f.label || 'Listado'}</div>
          {(Array.isArray(f.items) ? f.items : []).map((it: any) => (
            <div key={it.id} style={{ padding: 8, border: '1px solid #eee', marginTop: 6 }}>{it.type === 'text' ? (it.value || 'Texto') : 'Imagen'}</div>
          ))}
        </div>
      );
    case 'division':
      return <div style={{ textAlign: 'center', color: '#607D8B' }}>— Fin de página —</div>;
    case 'columns':
      return <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, border: '1px dashed #eee', padding: 8 }}>{(f.children && f.children[0] || []).map((c: any) => <div key={c.key}>{c.label}</div>)}</div>
        <div style={{ flex: 1, border: '1px dashed #eee', padding: 8 }}>{(f.children && f.children[1] || []).map((c: any) => <div key={c.key}>{c.label}</div>)}</div>
      </div>;
    case 'parts':
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{f.label || 'Repuestos'}</div>
          {(Array.isArray(f.parts) ? f.parts : []).map((p: any) => (
            <div key={p.partId} style={{ padding: 8, border: '1px solid #eee', marginTop: 6 }}>
              <div style={{ fontWeight: 600 }}>{p.name || p.partId}</div>
              <div style={{ color: '#607D8B' }}>Cantidad: {p.quantity}</div>
            </div>
          ))}
        </div>
      );
    case 'supplies':
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{f.label || 'Insumos'}</div>
          {(Array.isArray(f.supplies) ? f.supplies : []).map((s: any) => (
            <div key={s.supplyId} style={{ padding: 8, border: '1px solid #eee', marginTop: 6 }}>
              <div style={{ fontWeight: 600 }}>{s.name || s.supplyId}</div>
              <div style={{ color: '#607D8B' }}>Cantidad: {s.quantity}</div>
            </div>
          ))}
        </div>
      );
    default:
      return <div>{f.label ?? f.type}</div>;
  }
};

const TemplatePreview: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await templatesApi.getTemplate(id);
        if (!mounted) return;
        setTemplate(res);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la pauta');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <IonPage><IonContent className="ion-padding">Cargando...</IonContent></IonPage>;

  if (error) return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: 12 }}>{error}</div>
        <IonButton onClick={() => history.push('/templates')}>Volver</IonButton>
      </IonContent>
    </IonPage>
  );

  const structure = template?.structure ?? template?.structure ?? { components: [] };
  const components = structure.components || [];

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          
          <div>
            <IonButton fill={'clear'} shape={'round'} onClick={() => history.push('/templates')}>
              <IonIcon slot='icon-only' style={{color: '#333'}} icon={arrowBackOutline}/>
            </IonButton>
          </div>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol />
            <IonCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6" sizeXl="5">
              <div style={{border: '5px solid #333', borderRadius: 30}}>
                <div style={{maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', padding: 30, margin: 10}}>
                  <IonToolbar>
                    <div>
                      <h2>{template?.name}</h2>
                      <div style={{ color: '#607D8B' }}>{template?.description}</div>
                    </div>
                  </IonToolbar>
                  {components.length === 0 ? (
                    <div>No hay componentes</div>
                  ) : (
                    <IonList>
                      {components.map((c: any, idx: number) => (
                        <IonItem key={c.key || idx} style={{marginBottom: 30}}>
                          <div style={{ width: '100%' }}>
                            <div style={{ fontWeight: 700 }}>{c.label || c.type}</div>
                            <div style={{ marginTop: 6 }}>{renderFieldPreview(c)}</div>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              </div>
            </IonCol>
            <IonCol />
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default TemplatePreview;
