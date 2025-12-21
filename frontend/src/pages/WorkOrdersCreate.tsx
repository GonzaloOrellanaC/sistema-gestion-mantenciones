

    import React, { useEffect, useState, useMemo } from 'react';
    import {
      IonPage,
      IonHeader,
      IonToolbar,
      IonTitle,
      IonContent,
      IonItem,
      IonLabel,
      IonSelect,
      IonSelectOption,
      IonButton,
      IonTextarea,
      IonSpinner,
      IonToast,
      IonInput
    } from '@ionic/react';

    import templatesApi from '../api/templates';
    import usersApi from '../api/users';
    import rolesApi from '../api/roles';
    import workOrdersApi from '../api/workOrders';
    import * as branchesApi from '../api/branches';
    import { useHistory } from 'react-router-dom';
    import type { Template, User, Role } from '../api/types';
  import sortByName from '../utils/sort';

    const WorkOrdersCreate: React.FC = () => {
      const [templates, setTemplates] = useState<Template[]>([]);
      const [users, setUsers] = useState<User[]>([]);
      const [roles, setRoles] = useState<Role[]>([]);
      const [branches, setBranches] = useState<any[]>([]);
      const [branchId, setBranchId] = useState<string | undefined>(undefined);

      const [templateId, setTemplateId] = useState('');
      const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
      const [assigneeRole, setAssigneeRole] = useState<string | undefined>(undefined);
      // Friendly fields instead of raw JSON
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal');
      const [scheduledStart, setScheduledStart] = useState<string | undefined>(undefined);

      const [loading, setLoading] = useState(false);
      const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

      // Calendar state for center column
      const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
      });

      useEffect(() => {
        // load templates, users and roles
        let mounted = true;
        async function load() {
          try {
            const t = await templatesApi.listTemplates({ limit: 100 });
            const u = await usersApi.listUsers({ limit: 200 });
            const r = await rolesApi.listRoles({ limit: 200 });
            const br = await branchesApi.listBranches({});
            if (!mounted) return;
            setTemplates(sortByName(t.items || []));
            setUsers(sortByName(u.items || []));
            setRoles(sortByName(r.items || []));
            setBranches(sortByName(br.items || []));
          } catch (e: any) {
            console.error('load lists err', e);
            setToast({ show: true, message: e?.message || 'Error cargando datos' });
          }
        }
        load();
        return () => { mounted = false; };
      }, []);

      // ensure mutual exclusivity: when selecting user disable role and viceversa
      useEffect(() => {
        if (assigneeId) setAssigneeRole(undefined);
      }, [assigneeId]);
      useEffect(() => {
        if (assigneeRole) setAssigneeId(undefined);
      }, [assigneeRole]);

      const history = useHistory();

      function monthStart(date: Date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      }

      function formatDateOnly(d?: string | Date | null) {
        if (!d) return '';
        if (typeof d === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          const dt = new Date(d);
          if (Number.isNaN(dt.getTime())) return '';
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
        const dt = d as Date;
        if (Number.isNaN(dt.getTime())) return '';
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }

      const daysInMonth = useMemo(() => {
        const start = monthStart(currentMonth);
        const year = start.getFullYear();
        const month = start.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const days: Date[] = [];
        for (let d = 1; d <= lastDay; d++) days.push(new Date(year, month, d));
        return days;
      }, [currentMonth]);

      function pickDate(day: Date) {
        // prevent past dates
        const today = new Date();
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        if (dayMid < todayMid) {
          setToast({ show: true, message: 'No puede seleccionar una fecha anterior a hoy' });
          return;
        }
        // store as date-only string YYYY-MM-DD to ignore time component
        const y = day.getFullYear();
        const m = String(day.getMonth() + 1).padStart(2, '0');
        const d = String(day.getDate()).padStart(2, '0');
        setScheduledStart(`${y}-${m}-${d}`);
      }

      async function handleSubmit() {
        if (!templateId) {
          setToast({ show: true, message: 'Seleccione una plantilla' });
          return;
        }

        if (!scheduledStart) {
          setToast({ show: true, message: 'Seleccione fecha y hora de inicio programado' });
          return;
        }

        // Build structured data from friendly fields
        const parsedData: any = {
          title: title || undefined,
          description: description || undefined,
          priority: priority || undefined,
        };

        const payload: any = { templateId, data: parsedData };
        // scheduledStart expected as ISO string
        if (scheduledStart) payload.scheduledStart = scheduledStart;
        if (assigneeId) payload.assigneeId = assigneeId;
        if (assigneeRole) payload.assigneeRole = assigneeRole;
        if (branchId) payload.branchId = branchId;

        setLoading(true);
        try {
          const wo = await workOrdersApi.createWorkOrder(payload);
          // After successful creation navigate back to list and include new id as query
          if (wo && wo._id) {
            history.push(`/work-orders`);
            return;
          }
          setToast({ show: true, message: `Orden creada #${wo.orgSeq || ''}` });
          // reset form
          setTemplateId('');
          setAssigneeId(undefined);
          setAssigneeRole(undefined);
          setTitle('');
          setDescription('');
          setPriority('normal');
          setScheduledStart(undefined);
        } catch (err: any) {
          console.error('create wo err', err);
          setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Error creando orden' });
        } finally {
          setLoading(false);
        }
      }

      return (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Crear Orden de Trabajo</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent fullscreen>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px 360px', gap: 20, alignItems: 'start' }}>
                {/* Left: form */}
                <div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <IonItem>
                      <IonLabel position="stacked">Plantilla</IonLabel>
                      <IonSelect value={templateId} placeholder="Seleccione plantilla" onIonChange={e => setTemplateId(e.detail.value)}>
                        {templates.map(t => (
                          <IonSelectOption key={t._id} value={t._id}>{t.name}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Sucursal (opcional)</IonLabel>
                        <IonSelect value={branchId} placeholder="Seleccione sucursal" onIonChange={e => setBranchId(e.detail.value)}>
                          <IonSelectOption value="">--Todas--</IonSelectOption>
                          {branches.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
                        </IonSelect>
                      </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Título breve</IonLabel>
                      <IonInput value={title} placeholder="Ej: Revisión motor" onIonChange={e => setTitle(e.detail.value || '')} />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Descripción</IonLabel>
                      <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value || '')} placeholder="Descripción detallada del trabajo" rows={6} />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Prioridad</IonLabel>
                      <IonSelect value={priority} onIonChange={e => setPriority(e.detail.value)}>
                        <IonSelectOption value="low">Baja</IonSelectOption>
                        <IonSelectOption value="normal">Normal</IonSelectOption>
                        <IonSelectOption value="high">Alta</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <div style={{ marginTop: 16 }}>
                      <IonButton expand="block" onClick={handleSubmit} disabled={loading}>
                        {loading ? <><IonSpinner name="dots" /> Creando...</> : 'Crear Orden'}
                      </IonButton>
                    </div>
                  </div>
                </div>

                {/* Center: calendar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</strong>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)))}>◀</IonButton>
                      <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date()))}>Hoy</IonButton>
                      <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)))}>▶</IonButton>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
                    {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
                      <div key={d} style={{ fontSize: 12, textAlign: 'center', color: '#607D8B' }}>{d}</div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {daysInMonth.map(day => {
                      const key = formatDateOnly(day);
                      const selected = scheduledStart ? formatDateOnly(scheduledStart) === key : false;
                      return (
                        <div key={key} onClick={() => pickDate(day)} style={{ minHeight: 72, padding: 8, border: selected ? '2px solid var(--ion-color-primary)' : '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: selected ? 'var(--ion-color-primary-variant)' : undefined }}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ fontSize: 13 }}>{day.getDate()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: suggestion panel */}
                <div>
                  <div style={{ padding: 12, border: '1px dashed #e0e0e0', borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Sugerencia: Información para generar la OT</div>
                    <div style={{ fontSize: 13, color: '#555' }}>
                      En lugar de enviar un JSON libre, recolecta campos concretos para la generación de la orden. Por ejemplo:
                      <ul style={{ marginTop: 6 }}>
                        <li><strong>Título</strong>: resumen breve de la tarea.</li>
                        <li><strong>Descripción</strong>: instrucciones o contexto.</li>
                        <li><strong>Prioridad</strong>: baja/normal/alta.</li>
                        <li><strong>Ubicación o Equipo</strong>: si aplica, el lugar o elemento a intervenir.</li>
                        <li><strong>Adjuntos</strong>: fotos o archivos (subida separada).</li>
                        <li><strong>Campos específicos de la plantilla</strong>: si la plantilla requiere valores (por ejemplo medida, cantidad, modelo), crear inputs dedicados que mapeen a `data`.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
            </div>
          </IonContent>
        </IonPage>
      );
    };

    export default WorkOrdersCreate;