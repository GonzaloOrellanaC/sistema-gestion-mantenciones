import React, { useEffect, useState, useCallback } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonToast, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon, IonModal } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/users';
import { logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { useTranslation } from 'react-i18next';
import { WORK_ORDER_STATES } from '../constants/workOrderStates';
import Cropper from 'react-easy-crop';
import { readFileAsDataURL, getCroppedImg, dataURLToBlob } from '../utils/imageCrop';
import api from '../api/axios';

const Profile: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<{ done: number; pending: number }>({ done: 0, pending: 0 });
  const initials = `${(user?.firstName || firstName || '').charAt(0)}${(user?.lastName || lastName || '').charAt(0)}`.toUpperCase();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const history = useHistory()
  const { t } = useTranslation();
  const roleLabel = (user as any)?.role?.name || (user as any)?.role || t('profile.role_user');

  useEffect(() => {
    console.log('User changed, updating profile state:', user);
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setPhotoDataUrl(user?.photoUrl || null);
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      if (!user?.id) return;
      try {
        console.log('Loading work order stats for user:', user);
        const orgId = (user as any)?.orgId;
        const mod = await import('../api/workOrders');
        const data = await mod.getWorkOrders({ page: 1, limit: 1000, filters: { assigneeId: (user as any).id } });
        console.log('Loaded work orders for stats:', data);
        const list = data.items || data.data || data;
          if (Array.isArray(list)) {
            const done = list.filter((w: any) => {
              const s = (w.state || '').toLowerCase();
              return s === String(WORK_ORDER_STATES.APPROVED).toLowerCase() || s === String(WORK_ORDER_STATES.UNDER_REVIEW).toLowerCase();
            }).length;
            const pending = list.filter((w: any) => {
              const s = (w.state || '').toLowerCase();
              return s === String(WORK_ORDER_STATES.ASSIGNED).toLowerCase() || s === String(WORK_ORDER_STATES.REJECTED).toLowerCase();
            }).length;
            setStats({ done, pending });
        } else {
          setStats({ done: 0, pending: 0 });
        }
      } catch (err) {
        setStats({ done: 0, pending: 0 });
      }
    }
    loadStats();
  }, [user]);

  async function onSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateUser((user as any).id, { firstName, lastName, email });
      setMessage(t('profile.updated'));
      await refreshUser();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || t('profile.update_error'));
    } finally {
      setSaving(false);
    }
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    setPhotoDataUrl(dataUrl as string);
    setShowCrop(true);
  };

  const applyCrop = async () => {
    try {
      const cropped = await getCroppedImg(photoDataUrl || '', croppedAreaPixels, 0);
      // Upload cropped image to server or update local preview
      // For now, set as preview and close modal
      const dataUrl = cropped as string;
      setPhotoDataUrl(dataUrl);
      setShowCrop(false);
      // upload to server
      try {
        const blob = dataURLToBlob(dataUrl);
        if (blob && user?.id) {
          const fd = new FormData();
          fd.append('file', blob, `avatar_${user.id}.jpg`);
          fd.append('type', 'avatars');
          const res: any = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          const meta = res.data && res.data.meta ? res.data.meta : null;
          const url = meta && meta.url ? meta.url : null;
          if (url) {
            try {
              await updateUser((user as any).id, { photoUrl: url });
              await refreshUser();
              setMessage(t('profile.photo_saved') || 'Foto guardada');
            } catch (e) {
              console.error('failed to save user photoUrl', e);
              setMessage(t('profile.photo_save_error') || 'Error guardando foto');
            }
          }
        }
      } catch (uploadErr) {
        console.error('upload err', uploadErr);
        setMessage(t('profile.photo_upload_error') || 'Error subiendo foto');
      }
    } catch (e) {
      console.error('crop err', e);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <input id="profile-photo-input" type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFile((e.target.files && e.target.files[0]) || null)} />
              <label htmlFor="profile-photo-input" style={{ cursor: 'pointer', display: 'inline-block' }}>
                <div style={{
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  background: photoDataUrl ? 'transparent' : 'linear-gradient(135deg, #81D4FA, #0288D1)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  boxShadow: '0 10px 25px rgba(2,136,209,0.18)',
                  overflow: 'hidden'
                }}>
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                  )}
                </div>
              </label>

              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user ? `${user.firstName} ${user.lastName}` : `${firstName} ${lastName}`}</div>
              <p style={{ color: '#78909C', fontWeight: 500, margin: '6px 0 12px' }}>{roleLabel}</p>
            </div>
            <div style={{
              background: '#E8F5E9', color: '#2E7D32', padding: '6px 14px',
              borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }}></div>
              {t('profile.online')}
            </div>
          </div>

          <IonModal isOpen={showCrop} onDidDismiss={() => setShowCrop(false)}>
            <div style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                {photoDataUrl ? (
                  <Cropper
                    image={photoDataUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                ) : null}
              </div>
              <div style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <IonButton fill="clear" onClick={() => setShowCrop(false)}>{t('common.cancel') || 'Cancelar'}</IonButton>
                <IonButton onClick={() => applyCrop()}>{t('common.save') || 'Guardar'}</IonButton>
              </div>
            </div>
          </IonModal>

          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonCard style={{ textAlign: 'center', margin: 0 }}>
                  <IonCardContent>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0288D1' }}>{stats.done}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>{t('profile.done_label')}</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6">
                <IonCard style={{ textAlign: 'center', margin: 0 }}>
                  <IonCardContent>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFA726' }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>{t('profile.pending_label')}</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonList>
            <IonItem button onClick={() => history.push('/editar-perfil')}>
              <IonIcon icon={personOutline} slot="start" color="medium" />
              <IonLabel>{t('profile.edit_label')}</IonLabel>
            </IonItem>
            <IonItem button onClick={() => history.push('/settings')}>
              <IonIcon icon={settingsOutline} slot="start" color="medium" />
              <IonLabel>{t('settings_button') || 'Configuraciones'}</IonLabel>
            </IonItem>
            <IonItem button onClick={() => logout()} style={{ '--background': '#FFEBEE' } as any}>
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">{t('profile.logout')}</IonLabel>
            </IonItem>
          </IonList>

          <IonToast isOpen={!!message} message={message || ''} duration={2000} onDidDismiss={() => setMessage(null)} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
