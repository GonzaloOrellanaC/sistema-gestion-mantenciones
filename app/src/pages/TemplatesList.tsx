import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSpinner } from '@ionic/react';
import { getTemplates, TemplateDTO } from '../api/templates';
import { useAuth } from '../context/AuthContext';

const TemplatesList: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const orgId = (user as any)?.orgId;
      const data = await getTemplates(orgId);
      const list = data.items || data.data || data;
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Pautas</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {loading ? <div style={{ padding: 16 }}><IonSpinner /></div> : (
            <IonList>
              {templates.length === 0 && <div style={{ padding: 16 }}>No hay pautas.</div>}
              {templates.map(t => (
                <IonItem key={t._id} button>
                  <IonLabel>
                    <h3>{t.name}</h3>
                    <p>Creada: {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonPage>
  );
};

export default TemplatesList;
