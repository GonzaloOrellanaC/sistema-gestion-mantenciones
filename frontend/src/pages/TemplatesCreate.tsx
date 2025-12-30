import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonGrid, IonRow, IonCol, IonTextarea, IonToast, IonText } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import PartSelector from '../components/Widgets/PartSelector.widget';
import * as templatesApi from '../api/templates';
import { useHistory } from 'react-router-dom';
import '../styles/login.css';

const TemplatesCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState('{}');
  const [partsSelection, setPartsSelection] = useState<Array<any>>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();

  const submit = async () => {
    if (!name.trim()) return setToast({ show: true, message: 'Nombre requerido' });
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(structure);
    } catch {
      return setToast({ show: true, message: 'Structure JSON inválido' });
    }
    try {
      // embed selected parts into structure under `parts` key
      const finalStructure = { ...((parsed as any) || {}), parts: partsSelection };
      await templatesApi.createTemplate({ name: name.trim(), description, structure: finalStructure });
      setToast({ show: true, message: 'Pauta creada' });
      setTimeout(() => history.push('/templates'), 600);
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Error creando pauta';
      setToast({ show: true, message: msg });
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol sizeXl="6" sizeLg="7" sizeMd="8" sizeSm="10" sizeXs="12">
              <div className="auth-card">
                <h3>Crear Pauta</h3>
                <form onSubmit={(e) => { e.preventDefault(); submit(); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}>
                  <div className="form-field">
                    <Input label="Nombre" type="text" value={name} onInput={(e: any) => setName(e.detail?.value ?? '')} name="template_name" />
                  </div>

                  <div className="form-field">
                    <Input label="Descripción" type="text" value={description} onInput={(e: any) => setDescription(e.detail?.value ?? '')} name="template_description" />
                  </div>

                  <div className="form-field">
                    <div style={{ marginBottom: 8, fontSize: 14, color: 'var(--color-muted, #607D8B)' }}>Estructura JSON</div>
                    <IonTextarea autoGrow={true} placeholder='Ej: {"fields": []}' value={structure} onIonChange={(e: CustomEvent<{ value?: string | null }>) => setStructure(e.detail.value ?? '')} />
                  </div>

                  <div className="form-field">
                    <div style={{ marginBottom: 8, fontSize: 14, color: 'var(--color-muted, #607D8B)' }}>Parts (optional)</div>
                    <PartSelector onChange={(items) => setPartsSelection(items)} />
                  </div>

                  <div style={{ margin: '16px 0' }}>
                    <IonButton className="btn btn-primary" expand="block" type="submit">Crear pauta</IonButton>
                    <IonButton className="btn btn-secondary" expand="block" fill="clear" onClick={() => history.push('/templates')}>Cancelar</IonButton>
                  </div>
                </form>

                {toast.show && (
                  <div style={{ paddingTop: 8 }}>
                    <IonText color="primary">{toast.message}</IonText>
                  </div>
                )}
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default TemplatesCreate;
