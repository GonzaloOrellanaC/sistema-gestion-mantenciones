import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonList, IonItem, IonLabel, IonThumbnail, IonImg, IonSpinner, IonText } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { addOutline } from 'ionicons/icons';
import { axiosInstance } from '../api/axios';

const Assets: React.FC = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get('/assets');
        console.log('Assets response', res);
        const list = res.data?.items ?? res.data ?? [];
        if (mounted) setAssets(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error('Failed loading assets', e);
        if (mounted) setError(e?.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <div style={{
          margin: 0,
          borderRadius: '0px 0px 20px 20px',
          padding: 18,
          background: 'var(--ion-color-primary)',
          color: 'white',
          position: 'relative',
          boxShadow: '0 6px 18px rgba(2,40,71,0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{t('pages.assets') || 'Assets'}</div>
              <div style={{ marginTop: 8, fontSize: 14, opacity: 0.95 }}>{t('assets.subtitle') || 'Gestión de assets'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IonButtons>
                <IonButton routerLink="/assets/new">
                  <IonIcon icon={addOutline} />
                </IonButton>
              </IonButtons>
            </div>
          </div>
        </div>
      </IonHeader>
      <IonContent className="view-content">
        <div className="app-container">
          <div style={{ padding: 16 }}>
            <div className="card">
              <p style={{ margin: 0 }}>{t('assets.intro') || 'Aquí podrás ver y gestionar los assets.'}</p>
            </div>

            {loading && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonSpinner name="crescent" />
                <div>Cargando activos…</div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16 }}>
                <IonText color="danger">{error}</IonText>
              </div>
            )}

            {!loading && !error && (
              <IonList style={{ marginTop: 12 }}>
                {assets.length === 0 && <div style={{ padding: 12 }}>No hay activos.</div>}
                {assets.map((a) => (
                  <IonItem key={a._id} routerLink={`/assets/${a._id}`} button>
                    {(() => {
                      const img = Array.isArray(a.images) && a.images.length ? a.images[0] : null;
                      const src = typeof img === 'string' ? img : img && (img.url || img.path || img.filename);
                      return src ? (
                        <IonThumbnail slot="start">
                          <IonImg src={src} />
                        </IonThumbnail>
                      ) : null;
                    })()}
                    <IonLabel>
                      <div style={{ fontWeight: 700 }}>{a.name || a.serial || '—'}</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>
                        {[
                          a.brandId && typeof a.brandId === 'object' ? a.brandId.name : a.brandName,
                          a.modelId && typeof a.modelId === 'object' ? a.modelId.name : a.modelName,
                        ].filter(Boolean).join(' / ')}
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Assets;
