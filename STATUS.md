**Estado del Proyecto**

**Resumen:**
- **Repositorio:** `sistema-gestion-mantencion` (raíz del workspace).
- **Archivo de referencia:** `PLAN.md` (ya existe).

---

**Backend (resumen breve):**
- Autenticación: registro/login/recuperación/restablecimiento de contraseña, JWT y bcrypt (`backend/src/controllers/authController.ts`, `backend/src/services/authService.ts`).
- Roles y permisos: modelo `Role` con `permissions` y CRUD básico (`backend/src/models/Role.ts`, `backend/src/routes/roles.ts`, `backend/src/services/rolesService.ts`).
- Templates (Pautas): modelo + CRUD + preview (`backend/src/models/Template.ts`, `backend/src/services/templatesService.ts`, `backend/src/controllers/templatesController.ts`).
- Work Orders: modelo, flujo básico y contador por org (`backend/src/models/WorkOrder.ts`, `backend/src/services/workOrdersService.ts`, `backend/src/services/countersService.ts`).
- FileMeta, Counters, PasswordResetToken, EmailLog y utilitarios (mailer, socket.io) presentes.

**Cambios recientes relevantes:**
- Corregido un comportamiento: las plantillas NO deben almacenar asignaciones. Las asignaciones aplican a las Órdenes de Trabajo generadas a partir de una plantilla.
- He revertido la propiedad `assignedTo`/`assignedRole` desde `templates` y eliminé el endpoint `/api/templates/:id/assign`.
- `workOrdersService.createWorkOrder` ahora acepta `assigneeId` o `assigneeRole` en el payload; si se proporciona, la OT se crea con estado `Asignado` y se registra el historial.
- Se añadió validación cuando se asigna en la creación: `assigneeId` debe ser un usuario de la misma `orgId`; `assigneeRole` buscará un usuario del rol en la misma organización.

---

**Frontend — Estado del avance (detallado)**

- **Infra y utilidades**:
  - `frontend/src/api/axios.ts`: instancia `axios` con `baseURL` configurable (`VITE_API_BASE_URL`) y un interceptor que añade `Authorization` desde `localStorage`.
  - APIs tipadas: `frontend/src/api/*` incluye `auth.ts`, `users.ts`, `roles.ts`, `templates.ts`, `workOrders.ts`, `files.ts`.

- **Autenticación / Estado de sesión**:
  - `frontend/src/context/AuthContext.tsx`: proveedor `AuthProvider` que carga token desde `localStorage`, intenta `authApi.me()` al inicio y mantiene `user`, `token`, `loading`.
  - `login` persiste token en `localStorage` con fallback a cookie si localStorage falla; establece header `Authorization` en el cliente `axios`.
  - Se corrigió el problema de recarga (Enter key/native submit) en el formulario de `Login` y se eliminó doble `onClick`, evitando perder el token al autenticarse.

- **Layout y navegación**:
  - `frontend/src/components/MainLayout.tsx`: `IonSplitPane` + `IonMenu` persistente para usuarios autenticados; menú contiene enlaces a `Dashboard`, `Usuarios`, `Roles`, `Pautas` y botón de logout.
  - `MainLayout` solo se muestra cuando hay token (`useAuth().token`).

- **Páginas implementadas (básico → funcional)**:
  - `Login`, `Register`, `ForgotPassword`, `ChangePassword`: formularios y llamadas a `authApi` implementadas.
  - `Dashboard`: vista inicial replicada del template (estética básica).
  - `UsersList`: diseño y visual, actualmente con datos de ejemplo (pendiente integrar CRUD completo).
  - `RolesList`: página placeholder creada (lista sencilla; CRUD mínimo pendiente/en progreso).
  - `TemplatesList`, `TemplatesCreate`, `TemplatePreview`: list/create/preview básicos implementados en frontend y conectados a `frontend/src/api/templates.ts`; añadida funcionalidad de eliminar plantilla desde la UI.

- **Fixes y mejoras recientes**:
  - Añadido el endpoint `GET /api/auth/me` en backend y controlador `me` (resuelve 404 que fallaba al cargar usuario desde token).
  - Manejo robusto del token en `AuthContext.login` (persistencia + set header + setUser).
  - Evitado reload por submit nativo en `Login` (Enter key) que causaba pérdida del token.

- **Integraciones pendientes en frontend**:
  - Completar integración de `UsersList` con `frontend/src/api/users.ts` (CRUD paginada).
  - Mejorar `RolesList`: mostrar permisos como checkboxes, CRUD completo y validaciones.
  - Proteger rutas con `ProtectedRoute` para redirigir cuando no hay token (ahora el layout oculta el menú, pero las rutas aún pueden cargarse si se accede directo).
  - Mejorar manejo de errores y loading states (spinners, mensajes de error detallados).
  - Tests de frontend (componentes y flows críticos como login, token persistence).

---

**Prioridad inmediata / Siguientes pasos recomendados (Frontend + Backend pequeñas tareas)**

1. Ejecutar y probar flujo end-to-end: levantar backend y frontend, registrar/entrar y verificar `localStorage.token` y menú persistente.
2. Implementar `ProtectedRoute` y aplicar a rutas privadas (`/dashboard`, `/users`, `/templates`, `/roles`).
3. Completar CRUD de `Roles` (frontend): editor de permisos (checkboxes) y validaciones.
4. Finalizar Users CRUD con paginación y llamadas reales al backend.
5. Añadir tests unitarios para `AuthContext` y componentes clave.

---

Fecha del estado: 2025-12-19

**Notas:**
- El backend ya proporciona los endpoints necesarios para `roles` y `templates`; la mayoría del trabajo frontend es integrar y pulir UX/validaciones. Puedo encargarme de cualquiera de los puntos siguientes (arrancar servidores, crear `ProtectedRoute`, mejorar Roles UI, añadir tests). Indica cuál prefieres que haga a continuación.
-
## Actualizaciones recientes (2025-12-30)

- Entornos: actualizado `VITE_API_BASE_URL` y `VITE_SOCKET_URL` en `app/.env.*` y `frontend/.env.*` para apuntar a `http://gonzalo.ddns.net:5102`. Esto garantiza que web, app y archivos compilados apunten al backend desplegado.
- Frontend: `frontend/src/api/axios.ts` actualizado para usar `http://gonzalo.ddns.net:5102` como fallback `baseURL` cuando no exista `import.meta.env.VITE_API_BASE_URL`.
- Postman & docs: `postman/sistema-gestion.postman_collection.json` `baseUrl` y `postman/API_SUMMARY.md` actualizados a `http://gonzalo.ddns.net:5102`.
- Git: `app/.gitignore` actualizado para ignorar `android/`, `app/android` fue removido del índice con `git rm -r --cached app/android`, se creó el commit `Ignore app/android and remove from index` y se hizo `git push origin main`. Los archivos siguen presentes localmente pero no aparecen en el control de versiones.
- Estado operativo: los cambios mencionados están commiteados y empujados al remoto; recomiendo reconstruir el `app` y sincronizar `capacitor` si vas a generar builds con la nueva configuración de `VITE_API_BASE_URL`.

Si quieres, puedo:
- Ejecutar el build del `app` y sincronizar con Capacitor/Android con las nuevas variables.
- Crear un pequeño checklist de verificación (arrancar backend, probar endpoint /api/auth/me, login, subir archivo).
- Se añadió `STYLES.md` con un resumen y referencias de estilos/tema en el repositorio raíz. Ver [STYLES.md](STYLES.md).
- El plan (`PLAN.md`) fue actualizado para reflejar implementaciones actuales (autenticación, templates, contador por org, socket.io, frontend AuthContext y templates básicos).
- Pendientes clave: ProtectedRoute (guardas de rutas), CRUD completo de Roles desde frontend, integración paginada de Users y tests e2e.
