import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonTextarea, IonToast } from '@ionic/react';
import axios from 'axios';
import '../i18n';
import { useTranslation } from 'react-i18next';

// We'll dynamically import pdfmake on preview to avoid bundling/import-time errors

const Reporting: React.FC = () => {
  const { t } = useTranslation();
  const [templateJson, setTemplateJson] = useState<string>('{}');
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    try {
      const res = await axios.get('/api/reporting/template');
      setTemplateJson(JSON.stringify(res.data.template ?? {}, null, 2));
    } catch (err: any) {
      setToast({ show: true, message: 'Error cargando plantilla' });
    }
  }

  async function saveTemplate() {
    try {
      const parsed = JSON.parse(templateJson);
      await axios.post('/api/reporting/template', { template: parsed });
      setToast({ show: true, message: 'Plantilla guardada' });
    } catch (err: any) {
      setToast({ show: true, message: 'Error al guardar plantilla (JSON inválido?)' });
    }
  }

  function previewPdf() {
    (async () => {
      try {
        const docDef = JSON.parse(templateJson);
        // dynamically import pdfmake and vfs fonts
        const pdfMakeMod: any = await import('pdfmake/build/pdfmake');
        const pdfFontsMod: any = await import('pdfmake/build/vfs_fonts');
        const pdfMake = pdfMakeMod?.default ?? pdfMakeMod;
        // vfs can be exported in different shapes depending on bundler
        pdfMake.vfs = pdfFontsMod?.pdfMake?.vfs ?? pdfFontsMod?.vfs ?? pdfFontsMod?.default?.vfs;
        if (!pdfMake.vfs) {
          setToast({ show: true, message: 'Fonts vfs no disponibles para pdfmake' });
          return;
        }
        pdfMake.createPdf(docDef).download('report.pdf');
      } catch (err: any) {
        setToast({ show: true, message: 'JSON inválido para preview' });
      }
    })();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('nav.reporting', 'Reportería')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Editor JSON de plantilla (pdfmake)</div>
          <IonItem>
            <IonLabel position="stacked">JSON</IonLabel>
            <IonTextarea value={templateJson} autoGrow={true} spellCheck={false} onIonChange={(e: any) => setTemplateJson(e.detail?.value ?? '')} rows={20} />
          </IonItem>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <IonButton onClick={saveTemplate}>Guardar plantilla</IonButton>
          <IonButton color="secondary" onClick={loadTemplate}>Cargar</IonButton>
          <IonButton color="tertiary" onClick={previewPdf}>Preview PDF</IonButton>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default Reporting;
