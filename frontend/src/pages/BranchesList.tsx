import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonToast } from '@ionic/react';
import * as branchesApi from '../api/branches';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BranchesList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  const load = async () => {
    try {
      const res = await branchesApi.listBranches();
      setItems(res.items || []);
    } catch (e:any) { console.error(e); setToast({ show: true, message: 'Error cargando sucursales' }); }
  };

  // Load on mount and when we return from create/edit with a refresh signal
  useEffect(() => { load(); }, [location.key, location.state && (location.state as any).refresh]);

  const create = async () => {
    const name = window.prompt(t('branches.list.promptName'));
    if (!name) return;
    try {
      await branchesApi.createBranch({ name });
      setToast({ show: true, message: t('branches.list.created') });
      await load();
    } catch (e:any) { setToast({ show: true, message: e?.response?.data?.message || 'Error creando sucursal' }); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>Sucursales</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>{t('branches.list.heading')}</h3>
            <div>
              <IonButton onClick={() => history.push('/branches/new')}>{t('branches.list.newButton')}</IonButton>
            </div>
          </div>

          <IonList>
            {items.map(b => (
              <IonItem key={b._id} button onClick={() => history.push(`/branches/${b._id}/edit`)}>
                <IonLabel>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.address || ''}</div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default BranchesList;
