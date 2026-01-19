import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/react';
// Profile uses inline clickable image selector instead of FileUploader
import { useAuth } from '../context/AuthContext';
import * as usersApi from '../api/users';
import { chevronBackOutline } from 'ionicons/icons';

const ProfileEdit: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const history = useHistory();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createdUrlRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
    // try to load full user to find photo/docs
    // prefer direct photoUrl on user if present
    if ((user as any).photoUrl) {
      setCurrentPhotoUrl((user as any).photoUrl);
      return;
    }
    (async () => {
      try {
        const full = await usersApi.getUser((user as any)._id);
        if (full && (full as any).photoUrl) {
          setCurrentPhotoUrl((full as any).photoUrl);
          return;
        }
        if (full && (full as any).docs && (full as any).docs.length) {
          const docMeta = (full as any).docs[0];
          const p = (docMeta.path || docMeta.meta?.thumbnailPath || '').replace(/\\/g, '/');
          const idx = p.indexOf('/files/images/');
          const base = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');
          if (idx !== -1) {
            const rel = p.substring(idx + '/files/images/'.length);
            setCurrentPhotoUrl(`${base}/images/${rel}`);
          } else if (p.indexOf('/images/') !== -1) {
            const rel = p.substring(p.indexOf('/images/') + '/images/'.length);
            setCurrentPhotoUrl(`${base}/images/${rel}`);
          } else if (docMeta.filename && docMeta.orgId) {
            setCurrentPhotoUrl(`${base}/images/${docMeta.orgId}/misc/${docMeta.filename}`);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let res: any;
      const uid = (user as any)._id;
      if (photo) {
        const fd = new FormData();
        fd.append('firstName', firstName);
        fd.append('lastName', lastName);
        fd.append('email', email);
        fd.append('photo', photo);
        res = await usersApi.updateUser(uid, fd as any);
      } else {
        res = await usersApi.updateUser(uid, { firstName, lastName, email } as any);
      }
      await refreshUser();
      setToast({ show: true, message: t('profileEdit.toasts.updated') });
      setTimeout(() => history.push('/'), 900);
    } catch (e:any) {
      console.error('update profile err', e);
      setToast({ show: true, message: e?.response?.data?.message || t('profileEdit.toasts.updateError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
            <IonButton color={'dark'} slot="start" fill="clear" onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={chevronBackOutline} />
            </IonButton>
          <IonTitle>{t('profileEdit.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
            <IonRow>
                <IonCol sizeXs='12' sizeMd='4'>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%' }}>
                    <img
                      src={currentPhotoUrl || '/assets/default-profile.svg'}
                      alt="Foto de perfil"
                      onClick={() => inputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer', width: 160, height: 160, borderRadius: 80, objectFit: 'cover', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                    />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{currentPhotoUrl ? t('profileEdit.photo.current') : t('profileEdit.photo.default')}</div>
                  </div>
                </IonCol>
                <IonCol sizeXs='12' sizeMd='8'>
                    <div style={{ maxWidth: 900 }}>
                        <IonItem>
                        <IonLabel position="stacked">{t('profileEdit.labels.firstName')}</IonLabel>
                            <IonInput value={firstName} onIonChange={e => setFirstName(e.detail.value || '')} />
                        </IonItem>
                        <IonItem>
                        <IonLabel position="stacked">{t('profileEdit.labels.lastName')}</IonLabel>
                            <IonInput value={lastName} onIonChange={e => setLastName(e.detail.value || '')} />
                        </IonItem>
                        <IonItem>
                        <IonLabel position="stacked">{t('profileEdit.labels.email')}</IonLabel>
                            <IonInput value={email} onIonChange={e => setEmail(e.detail.value || '')} />
                        </IonItem>

                        <div style={{ marginTop: 12 }}>
                        <IonButton expand="block" onClick={handleSubmit} disabled={loading}>{loading ? t('profileEdit.buttons.saving') : t('profileEdit.buttons.saveChanges')}</IonButton>
                        </div>

                        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
                    </div>
                </IonCol>
            </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default ProfileEdit;
