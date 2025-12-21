import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { Input } from '../components/Widgets/Input.widget';
import * as rolesApi from '../api/roles';
import type { Role } from '../api/types';
import { useHistory, useParams } from 'react-router-dom';
import './UsersList.css';

const GROUPED_PERMISSIONS = [
  {
    title: 'Usuarios',
    permissions: [
      { key: 'editarUsuarios', label: 'Editar Usuarios' },
      { key: 'crearUsuarios', label: 'Crear Usuarios' },
    ],
  },
  {
    title: 'Pautas',
    permissions: [
      { key: 'verPautas', label: 'Ver Pautas' },
      { key: 'crearPautas', label: 'Crear Pautas' },
      { key: 'editarPautas', label: 'Editar Pautas' },
    ],
  },
  {
    title: 'Operaciones',
    permissions: [
      { key: 'asignarOT', label: 'Asignar OT' },
      { key: 'ejecutarOT', label: 'Ejecutar OT' },
      { key: 'supervisar', label: 'Supervisar' },
      { key: 'aprobarRechazar', label: 'Aprobar/Rechazar' },
    ],
  },
  {
    title: 'Roles & Gerencias',
    permissions: [
      { key: 'crearRoles', label: 'Crear Roles' },
      { key: 'editarRoles', label: 'Editar Roles' },
      
    ],
  },
  {
    title: 'Sucursales',
    permissions: [
      { key: 'crearSucursales', label: 'Crear Sucursales' },
      { key: 'editarSucursales', label: 'Editar Sucursales' },
    ],
  },
  {
    title: 'Insumos & Elementos',
    permissions: [
      { key: 'crearInsumos', label: 'Crear Insumos' },
      { key: 'editarInsumos', label: 'Editar Insumos' },
      
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
        setToast({ show: true, message: 'Error cargando rol' });
      }
    }
    loadRole();
    return () => { mounted = false; };
  }, [params.id]);

  const toggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (groupPermissions: { key: string; label: string }[]) => {
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
    if (!name.trim()) { setToast({ show: true, message: 'El nombre es requerido' }); return; }
    setSaving(true);
    try {
      const payload: Partial<Role> = { name: name.trim(), permissions };
      if (params.id) {
        await rolesApi.updateRole(params.id, payload);
        setToast({ show: true, message: 'Rol actualizado' });
        setTimeout(() => history.push('/roles'), 600);
      } else {
        await rolesApi.createRole(payload);
        setToast({ show: true, message: 'Rol creado' });
        setTimeout(() => history.push('/roles'), 600);
      }
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Error creando rol' });
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
              <h2 className="toolbar-title">Crear Rol</h2>
              <div className="toolbar-sub">Define nombre y permisos</div>
            </div>
            <div slot="end">
              <IonButton color="medium" onClick={() => history.push('/roles')}>Volver</IonButton>
            </div>
          </IonToolbar>
        </IonHeader>

        <form onSubmit={onSubmit}>
          <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 12 }}>
              <Input type="text" name="name" placeholder="Nombre del rol" value={name} onInput={(e:any) => setName(e.detail?.value ?? '')} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Permisos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {GROUPED_PERMISSIONS.map(group => {
                  const allSelected = group.permissions.every(p => !!permissions[p.key]);
                  return (
                    <div key={group.title} style={{ padding: 8, border: '1px solid #e6e6e6', borderRadius: 6, background: 'var(--ion-background-color, #fff)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>{group.title}</div>
                        <IonCheckbox
                          checked={allSelected}
                          onIonChange={() => toggleGroup(group.permissions)}
                        />
                      </div>
                      <IonList>
                        {group.permissions.map(p => (
                          <IonItem key={p.key} lines="none">
                            <IonLabel>{p.label}</IonLabel>
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
              <IonButton type="submit" color="primary" disabled={saving}>{saving ? 'Guardando...' : (params.id ? 'Actualizar' : 'Crear')}</IonButton>
              <IonButton color="medium" onClick={() => history.push('/roles')}>Cancelar</IonButton>
            </div>
          </div>
        </form>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default RoleCreate;
