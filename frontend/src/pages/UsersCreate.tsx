import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonList, IonItem, IonLabel } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import { Select as WidgetSelect } from '../components/Widgets/Select.widget';
import * as usersApi from '../api/users';
import * as rolesApi from '../api/roles';
import type { Role } from '../api/types';
import { useHistory, useParams } from 'react-router-dom';
import './UsersList.css';

const UsersCreate: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const history = useHistory();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    let mounted = true;
    const loadRoles = async () => {
      try {
        const res = await rolesApi.listRoles({ limit: 200 });
        if (!mounted) return;
        setRoles(res.items || []);
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
        setRoleId(u.roleId._id || null);
      } catch (err) {
        console.error('Error loading user', err);
        setToast({ show: true, message: 'Error cargando usuario' });
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
      setToast({ show: true, message: 'Completa los campos obligatorios' });
      return;
    }

    // In create mode password required; in edit mode we don't change password here
    if (!isEdit) {
      if (!password) { setToast({ show: true, message: 'La contraseña es requerida' }); return; }
      if (password !== confirmPassword) { setToast({ show: true, message: 'Las contraseñas no coinciden' }); return; }
    }

    setSaving(true);
    try {
      if (isEdit && params.id) {
        const payload: any = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
        if (roleId) payload.roleId = roleId;
        await usersApi.updateUser(params.id, payload);
        setToast({ show: true, message: 'Usuario actualizado' });
        setTimeout(() => history.push('/users'), 600);
      } else {
        const payload: any = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password };
        if (roleId) payload.roleId = roleId;
        await usersApi.createUser(payload);
        setToast({ show: true, message: 'Usuario creado' });
        setTimeout(() => history.push('/users'), 600);
      }
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: isEdit ? 'Error actualizando usuario' : 'Error creando usuario' });
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
              <h2 className="toolbar-title">{isEdit ? 'Editar Usuario' : 'Crear Usuario'}</h2>
              <div className="toolbar-sub">{isEdit ? 'Modifica los datos del usuario' : 'Agrega un nuevo usuario al sistema'}</div>
            </div>
            <div slot="end">
              <IonButton color="medium" onClick={() => history.push('/users')}>Volver</IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        <form onSubmit={onSubmit} style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" name="firstName" label="Nombre" value={firstName} onInput={(e: any) => setFirstName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="text" name="lastName" label="Apellido" value={lastName} onInput={(e: any) => setLastName(e.detail?.value ?? '')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input type="email" name="email" label="Correo electrónico" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} />
          </div>
          {!isEdit && (
            <div style={{ marginBottom: 12 }}>
              <Input passwordAleatory type="password" name="password" label="Contraseña" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Rol</label>
            <WidgetSelect
              value={roleId}
              onChange={(v) => setRoleId(v as string)}
              options={roles.map(r => ({ label: r.name, value: r._id! }))}
              placeholder="Selecciona un rol (opcional)"
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <IonButton type="submit" color="primary" disabled={saving || loading}>{saving ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}</IonButton>
            <IonButton color="medium" onClick={() => history.push('/users')}>Cancelar</IonButton>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default UsersCreate;
