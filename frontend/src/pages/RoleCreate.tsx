import React, { useEffect, useState } from 'react';
import { useStylingContext } from '../context/StylingContext';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import * as rolesApi from '../api/roles';
import type { Role } from '../api/types';
import { useHistory, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './UsersList.css';

const GROUPED_PERMISSIONS = [
  {
    titleKey: 'roles.groups.users',
    permissions: [
      { key: 'verUsuarios', labelKey: 'roles.permissions.verUsuarios' },
      { key: 'editarUsuarios', labelKey: 'roles.permissions.editarUsuarios' },
      { key: 'crearUsuarios', labelKey: 'roles.permissions.crearUsuarios' },
    ],
  },
  {
    titleKey: 'roles.groups.templates',
    permissions: [
      { key: 'verPautas', labelKey: 'roles.permissions.verPautas' },
      { key: 'crearPautas', labelKey: 'roles.permissions.crearPautas' },
      { key: 'editarPautas', labelKey: 'roles.permissions.editarPautas' },
    ],
  },
  {
    titleKey: 'roles.groups.operations',
    permissions: [
      { key: 'verOT', labelKey: 'roles.permissions.verOT' },
      { key: 'crearOT', labelKey: 'roles.permissions.crearOT' },
      { key: 'editarOT', labelKey: 'roles.permissions.editarOT' },
      { key: 'asignarOT', labelKey: 'roles.permissions.asignarOT' },
      { key: 'ejecutarOT', labelKey: 'roles.permissions.ejecutarOT' },
      { key: 'supervisar', labelKey: 'roles.permissions.supervisar' },
      { key: 'aprobarRechazar', labelKey: 'roles.permissions.aprobarRechazar' },
    ],
  },
  {
    titleKey: 'roles.groups.management',
    permissions: [
      { key: 'verRoles', labelKey: 'roles.permissions.verRoles' },
      { key: 'crearRoles', labelKey: 'roles.permissions.crearRoles' },
      { key: 'editarRoles', labelKey: 'roles.permissions.editarRoles' },
    ],
  },
  {
    titleKey: 'roles.groups.assets',
    permissions: [
      { key: 'verActivos', labelKey: 'roles.permissions.verActivos' },
      { key: 'crearActivos', labelKey: 'roles.permissions.crearActivos' },
      { key: 'editarActivos', labelKey: 'roles.permissions.editarActivos' },
    ],
  },
  {
    titleKey: 'roles.groups.organization',
    permissions: [
      { key: 'verOrganization', labelKey: 'roles.permissions.verOrganization' },
      { key: 'editarOrganization', labelKey: 'roles.permissions.editarOrganization' },
    ],
  },
  {
    titleKey: 'roles.groups.branches',
    permissions: [
      { key: 'verSucursales', labelKey: 'roles.permissions.verSucursales' },
      { key: 'crearSucursales', labelKey: 'roles.permissions.crearSucursales' },
      { key: 'editarSucursales', labelKey: 'roles.permissions.editarSucursales' },
    ],
  },
  {
    titleKey: 'roles.groups.supplies',
    permissions: [
      { key: 'verInsumos', labelKey: 'roles.permissions.verInsumos' },
      { key: 'crearInsumos', labelKey: 'roles.permissions.crearInsumos' },
      { key: 'editarInsumos', labelKey: 'roles.permissions.editarInsumos' },
    ],
  },
  {
    titleKey: 'roles.groups.parts',
    permissions: [
      { key: 'verRepuestos', labelKey: 'roles.permissions.verRepuestos' },
      { key: 'crearRepuestos', labelKey: 'roles.permissions.crearRepuestos' },
      { key: 'editarRepuestos', labelKey: 'roles.permissions.editarRepuestos' },
    ],
  },
  {
    titleKey: 'roles.groups.lots',
    permissions: [
      { key: 'verLotes', labelKey: 'roles.permissions.verLotes' },
      { key: 'crearLotes', labelKey: 'roles.permissions.crearLotes' },
      { key: 'editarLotes', labelKey: 'roles.permissions.editarLotes' },
    ],
  },
];

const RoleCreate: React.FC = () => {
    const params = useParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();
  const { buttonCancel } = useStylingContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (!params.id) return;
    let mounted = true;
    async function loadRole() {
      try {
        const role = await rolesApi.getRole(params.id!);
        if (!mounted) return;
        setName(role.name || '');
        setPermissions(role.permissions || {});
      } catch (err) {
        console.error(err);
        setToast({ show: true, message: t('roles.toasts.loadError') });
      }
    }
    loadRole();
    return () => { mounted = false; };
  }, [params.id]);

  const toggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (groupPermissions: { key: string; labelKey?: string }[]) => {
    setPermissions(prev => {
      const allSelected = groupPermissions.every(p => !!prev[p.key]);
      const next = { ...prev } as Record<string, boolean>;
      groupPermissions.forEach(p => {
        next[p.key] = !allSelected;
      });
      return next;
    });
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setToast({ show: true, message: t('roles.create.toasts.nameRequired') }); return; }
    setSaving(true);
    try {
      const payload: Partial<Role> = { name: name.trim(), permissions };
      if (params.id) {
        await rolesApi.updateRole(params.id, payload);
        setToast({ show: true, message: t('roles.create.toasts.updated') });
        setTimeout(() => history.push('/roles'), 600);
      } else {
        await rolesApi.createRole(payload);
        setToast({ show: true, message: t('roles.create.toasts.created') });
        setTimeout(() => history.push('/roles'), 600);
      }
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: t('roles.create.toasts.createError') });
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
              <h2 className="toolbar-title">{t('roles.create.title')}</h2>
              <div className="toolbar-sub">{t('roles.create.subtitle')}</div>
            </div>
          </IonToolbar>
        </IonHeader>

          <form onSubmit={onSubmit}>
            <div style={{ maxWidth: 1000 }}>
              <div style={{ marginBottom: 12 }}>
                <Input type="text" name="name" placeholder={t('roles.create.placeholders.name')} value={name} onInput={(e:any) => setName(e.detail?.value ?? '')} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>{t('roles.permissionsTitle')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div key="tablero" style={{ padding: 8, border: '1px solid #e6e6e6', borderRadius: 6, background: 'var(--ion-background-color, #fff)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 600 }}>{t('roles.groups.tablero')}</div>
                    </div>
                    <IonList>
                      <IonItem lines="none">
                        <IonLabel>{t('roles.permissions.verTablero')}</IonLabel>
                        <IonCheckbox slot="end" checked={!!permissions['verTablero']} onIonChange={() => toggle('verTablero')} />
                      </IonItem>
                    </IonList>
                  </div>
                  {GROUPED_PERMISSIONS.map(group => {
                    const allSelected = group.permissions.every(p => !!permissions[p.key]);
                    return (
                      <div key={group.titleKey} style={{ padding: 8, border: '1px solid #e6e6e6', borderRadius: 6, background: 'var(--ion-background-color, #fff)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontWeight: 600 }}>{t(group.titleKey)}</div>
                          <IonCheckbox
                            checked={allSelected}
                            onIonChange={() => toggleGroup(group.permissions)}
                          />
                        </div>
                        <IonList>
                          {group.permissions.map(p => (
                            <IonItem key={p.key} lines="none">
                              <IonLabel>{t(p.labelKey || p.key)}</IonLabel>
                              <IonCheckbox slot="end" checked={!!permissions[p.key]} onIonChange={() => toggle(p.key)} />
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton type="submit" color="primary" disabled={saving}>{saving ? t('roles.create.buttons.saving') : (params.id ? t('roles.create.buttons.update') : t('roles.create.buttons.create'))}</IonButton>
                <IonButton style={buttonCancel} onClick={() => history.push('/roles')}>{t('common.cancel')}</IonButton>
              </div>
            </div>
          </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default RoleCreate;
