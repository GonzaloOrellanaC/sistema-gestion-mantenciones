import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonList, IonItem, IonLabel } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import { Select as WidgetSelect } from '../components/Widgets/Select.widget';
import * as usersApi from '../api/users';
import * as rolesApi from '../api/roles';
import * as branchesApi from '../api/branches';
import type { Role } from '../api/types';
import { useHistory, useParams } from 'react-router-dom';
import './UsersList.css';

const UsersCreate: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const history = useHistory();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    let mounted = true;
    const loadRoles = async () => {
      try {
        const res = await rolesApi.listRoles({ limit: 200 });
        if (!mounted) return;
        setRoles(res.items || []);
        const br = await branchesApi.listBranches({});
        setBranches(br.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadRoles();
    return () => { mounted = false; };
  }, []);
  const isEdit = !!params?.id;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      if (!isEdit || !params.id) return;
      setLoading(true);
      try {
        const u = await usersApi.getUser(params.id);
        console.log('Loaded user for edit', u);
        if (!mounted) return;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setRoleId(typeof u.roleId === 'string' ? u.roleId : (u.roleId?._id || null));
        setBranchId(typeof u.branchId === 'string' ? u.branchId : (u.branchId?._id || null));
      } catch (err) {
        console.error('Error loading user', err);
        setToast({ show: true, message: t('usersCreate.toasts.loadError') });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadUser();
    return () => { mounted = false; };
  }, [isEdit, params?.id]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setToast({ show: true, message: t('usersCreate.toasts.fillRequired') });
      return;
    }

    // In create mode password required; in edit mode we don't change password here
    if (!isEdit) {
      if (!password) { setToast({ show: true, message: t('usersCreate.toasts.passwordRequired') }); return; }
    }

    setSaving(true);
    try {
      if (isEdit && params.id) {
        const payload: any = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
        if (roleId) payload.roleId = roleId;
          if (branchId) payload.branchId = branchId;
        await usersApi.updateUser(params.id, payload);
        setToast({ show: true, message: t('usersCreate.toasts.updated') });
        setTimeout(() => history.push('/users'), 600);
      } else {
        const payload: any = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password };
        if (roleId) payload.roleId = roleId;
          if (branchId) payload.branchId = branchId;
        await usersApi.createUser(payload);
        setToast({ show: true, message: t('usersCreate.toasts.created') });
        setTimeout(() => history.push('/users'), 600);
      }
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: isEdit ? t('usersCreate.toasts.updateError') : t('usersCreate.toasts.createError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="users-page ion-padding">
        <IonHeader className="users-header-toolbar ion-no-border">
          <IonToolbar>
            <div className="users-toolbar-left">
              <h2 className="toolbar-title">{isEdit ? t('usersCreate.editTitle') : t('usersCreate.createTitle')}</h2>
              <div className="toolbar-sub">{isEdit ? t('usersCreate.editSubtitle') : t('usersCreate.createSubtitle')}</div>
            </div>
            <div slot="end">
                <IonButton color="medium" onClick={() => history.push('/users')}>{t('usersCreate.back')}</IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        <form onSubmit={onSubmit} style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" name="firstName" label={t('usersCreate.labels.firstName')} value={firstName} onInput={(e: any) => setFirstName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" name="lastName" label={t('usersCreate.labels.lastName')} value={lastName} onInput={(e: any) => setLastName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="email" name="email" label={t('usersCreate.labels.email')} value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} />
          </div>
          {!isEdit && (
            <div style={{ marginBottom: 12 }}>
              <Input passwordAleatory type="password" name="password" label={t('usersCreate.labels.password')} value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>{t('usersCreate.labels.role')}</label>
            <WidgetSelect
              value={roleId}
              onChange={(v) => setRoleId(v as string)}
              options={roles.map(r => ({ label: r.name, value: r._id! }))}
              placeholder={t('usersCreate.placeholders.roleOptional')}
            />
          </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>{t('usersCreate.labels.branch')}</label>
              <WidgetSelect
                value={branchId}
                onChange={(v) => setBranchId(v as string)}
                options={branches.map(b => ({ label: b.name, value: b._id }))}
                placeholder={t('usersCreate.placeholders.branchOptional')}
              />
            </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <IonButton type="submit" color="primary" disabled={saving || loading}>{saving ? t('usersCreate.buttons.saving') : (isEdit ? t('usersCreate.buttons.update') : t('usersCreate.buttons.create'))}</IonButton>
            <IonButton color="medium" onClick={() => history.push('/users')}>{t('usersCreate.buttons.cancel')}</IonButton>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default UsersCreate;
