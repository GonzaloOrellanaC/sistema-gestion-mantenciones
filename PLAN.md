# Plan de acción — Sistema SAAS de Pautas y Órdenes de Trabajo

## Resumen
- Objetivo: Construir una plataforma SaaS que permita a organizaciones crear "pautas" (templates) para órdenes de trabajo, gestionar usuarios/roles, generar y seguir órdenes de trabajo y ofrecer una app móvil para ejecutar órdenes.
- Stack: Ionic React (web admin + mobile), Node.js + TypeScript + Express, MongoDB, Socket.io (push), Mailgun (mailgun-js).

## Alcance MVP
- Registro / Login / Recuperar contraseña / Restaurar contraseña.
- Crear organización al registrar (campo `nombre empresa`).
- Usuarios asociados a la organización; el primer usuario es Administrador (rol por defecto, no editable).
- Gestión de usuarios y roles predeterminados (checkboxes de permisos).
- Constructor de pautas (drag & drop) con vista previa (PC/Tablet/Móvil).
- CRUD de órdenes de trabajo, flujo de estados y notificaciones en tiempo real.
- App móvil para ejecutar y actualizar órdenes asignadas (cámara, geolocalización, archivos básicos).

## Requisitos clave y reglas de negocio
- El `nombre empresa` crea o enlaza una `organization`.
- El primer usuario de una organización es `Administrador` (permiso total). Ese rol siempre existe y no es editable.
- Roles y permisos: gestionar accesos predeterminados por organización; al crear usuarios, se aplican estos accesos pero pueden editarse solo durante la creación para ese usuario.
- Estados de órdenes: `Creado` -> `Asignado` -> `Iniciado` -> `En revisión` -> `Terminado`. Rechazo notifica al ejecutor para correcciones.
- Números de orden: deben ser únicos por organización y comenzar en 1. Implementar colección `counters` por `orgId` y operación atómica `findOneAndUpdate({orgId}, {$inc:{seq:1}}, {upsert:true, returnDocument:'after'})`.

### Confirmaciones recibidas (2025-11-25)
- Permisos definidos: `crearPautas`, `verPautas`, `editarPautas`, `asignarOT`, `supervisar`, `aprobarRechazar` con los significados provistos por el cliente.
- Rol administrador por defecto: **Owner** con permisos explícitos (crearé rol Owner durante el seed con permisos completos).
- Máquina de estados: reglas estrictas — backend validará transiciones permitidas antes de cada cambio de estado.
- Iniciar OT: **solo el assignee** puede iniciar la OT.
- Emails: se usará Mailgun en producción; `.env` contendrá `MAILGUN_API_KEY` y `MAILGUN_DOMAIN`.
- Socket.io: las notificaciones se enviarán por room `user:<userId>` (el frontend debe emitir `joinOrg` y también un `joinUser` con su userId para recibir notificaciones directas).
- Notificaciones push móvil: por ahora usar Socket.io; FCM/APNs queda para siguiente iteración.
- Almacenamiento de archivos: guardar localmente en `backend/files/{orgId}/{type}/{timestamp_filename}` para esta iteración. Tipo se envía en el formulario (`type`), p.ej. `profile`, `work_order_photos`, `documents`.
- Límite de archivos: 5 MB por archivo. Aplicar compresión en la App antes de enviar.
- Paginación: por defecto `limit=10` por página.
- Zona horaria: Backend opera en UTC; frontends renderizarán según la zona del cliente.
- `FRONTEND_URL` usado en emails (reset/links) — por defecto `http://localhost:5100`.
- Numeración OT: contador inicia en 1 por organización (implementado con `counters`).
- Política de borrado: se usa `deleted: boolean` (soft-delete). Al marcar `deleted=true` el registro no aparece en listados.
- Seed / Admin inicial: se crea un superadmin global en seed: Gonzalo Orellana (`gonzalo.orellana@kauel.com`, password `123456`) con `isSuperAdmin=true` y rol `Owner`.
- Destino de despliegue: máquina virtual Ubuntu 22 (ajustaremos variables y scripts de despliegue para esa plataforma).
- Prioridad inmediata: primero uploads/adjuntos (B), luego validaciones y tests (A).

Estos puntos se han incorporado en el backend y en `STATUS.md`.

## Modelado de datos (colecciones MongoDB sugeridas)
- `organizations` { _id, name, createdAt, meta }
- `users` { _id, orgId, firstName, lastName, email, passwordHash, roleId, isAdmin, createdAt }
- `roles` { _id, orgId, name, permissions: { editarUsuarios, verPautas, crearPautas, editarPautas, asignarOT, supervisar, aprobarRechazar, crearRoles, editarRoles, agregarGerencias, editarGerencias, crearSucursales, editarSucursales, crearInsumos, editarInsumos, crearElementos, editarElementos }, hierarchyLevel }
- `templates` (pautas) { _id, orgId, name, structure (JSON), previewConfigs, createdBy, createdAt }
- `work_orders` { _id, orgId, orgSeq, templateId, data (filled fields), state, assigneeId, client, dates: {created, start, end, approvedAt}, history }
- `counters` { _id, orgId, seq }
- `branches`, `departments`, `supplies`, `elements` según necesidad.
- `files` o GridFS para documentos grandes; metadata referenciado en `work_orders`.

## API (Node.js + Express + TypeScript) — Endpoints clave
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- Orgs: `GET/POST /api/orgs` (crear org al registrar)
- Users: `GET/POST/PUT/DELETE /api/orgs/:orgId/users`
- Roles: `GET/POST/PUT /api/orgs/:orgId/roles`
- Templates: `GET/POST/PUT/DELETE /api/orgs/:orgId/templates`
- Work Orders: `GET/POST/PUT /api/orgs/:orgId/work-orders`, acciones: assign/start/review/approve/reject
- Counters: internal helper `POST /api/orgs/:orgId/counters/next` (server-only)
- Files: `POST /api/files` (multer/gridfs)
- Calendar: `GET /api/orgs/:orgId/calendar-events`
- Realtime: Socket.io namespaces/rooms por `orgId` y por `userId`.

## Autenticación y seguridad
- Passwords con `bcrypt` y sal.
- Tokens JWT con expiración para APIs.
- Validaciones en backend (email, longitud password).
- Recomendado: limitar creación de múltiples `Cosmos-like` items por sesión; habilitar CORS solo para dominios de la plataforma.

## Contador de órdenes por organización (estrategia técnica)
- Colección `counters` con documento por `orgId`.
- Al crear una OT: usar transacción (si replica set) o `findOneAndUpdate` atómico: `findOneAndUpdate({ orgId }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })` y usar `seq` como `orgSeq`.
- Esto asegura unicidad por organización aun cuando la base de datos tenga órdenes con el mismo número global.

## Frontend — Ionic React (Web Admin)
- Páginas principales:
  - `Login` (con botones: Recuperar password, Registro) — ambos llevan a sus páginas.
  - `Register` (nombre, apellido, email, password, nombre empresa).
  - `Dashboard` (estadísticas de uso y KPI).
  - `Gestión de usuarios` (crear/editar usuarios y asignar permisos temporales durante creación).
  - `Gestión de accesos predeterminados` (lista roles, primer rol = Admin no editable; editar checkboxes de permisos).
  - `Gestión de pautas` (listado + botón Crear/Editar -> constructor drag & drop con preview responsiva).
  - `Lista de Órdenes de trabajo` (filtros por estado, asignado, fecha, cliente).
  - `Calendario` (FullCalendar integrado con vista mes/semana/día).

## Constructor de pautas (requisitos)
- Requisito: drag & drop desde un menú de componentes hacia lienzo; previsualización en tres breakpoints (PC, Tablet, Smartphone).
- Campos permitidos: texto corto, texto largo, imágenes (camera/gallery), file upload (.doc,.docx,.pdf,.txt), geolocalización con opción de mostrar mapa, select (single/multi), checkbox, secciones/temas.
- Librerías sugeridas:
  - Opción A (recomendada): Form.io (form builder + renderer) — potente, incluye drag-drop, soporte de archivos y preview; integrable con React.
  - Opción B: `react-dnd` + custom schema + renderer preview; usar `react-responsive` para previews por device.
- Guardar la `structure` en JSON en `templates`.

## App móvil (Ionic React + Capacitor)
- Funcionalidad limitada: ver órdenes asignadas, abrir/editar datos de ordenes, usar cámara/galería para fotos, subir documentos, capturar geolocalización, recibir notificaciones por Socket.io.
- Flujos: login, ver lista de OT asignadas, abrir OT (iniciar/guardar), enviar a revisión, recibir rechazo (notificación), ver historial.

## Notificaciones y Email
- Realtime push: `Socket.io` servidor emite eventos por `orgId` y `userId` (ej. `orderAssigned`, `orderRejected`, `orderUpdated`).
- Emails: `mailgun-js` para mensajes transaccionales (registro, restauración password, notificaciones críticas). Plantillas de correo en backend.

## Almacenamiento de archivos
- Imágenes y documentos: usar `GridFS` para documentos grandes y metadatos en `files` o usar almacenamiento externo (S3) si se prefiere. Móvil: usar Capacitor Camera / Filesystem y subir al backend.
- Soporte de extensiones: `.doc`, `.docx`, `.pdf`, `.txt` (validar MIME y tamaño).

## Calendar UI
- Integrar `FullCalendar React` para mostrar hitos y fechas clave; alimentar con eventos desde `work_orders` (start/end/approval).

## Control de accesos y jerarquía
- Permisos por checkbox dentro del rol.
- Campo `hierarchyLevel` para definir si un rol es ejecutor, supervisor o aprobador. Regla: si supervisor == aprobador entonces sólo nivel superior es Administrador.

## Tests, CI y despliegue
- Tests unitarios para backend (Jest + supertest) y tests básicos para frontend.
- CI pipeline (GitHub Actions): ejecutar linter, tests y desplegar a staging.
- Despliegue: node backend en servicio (PM2 / Docker), MongoDB en cluster (Atlas o tu host), Ionic web en CDN/hosting.

## Seguridad y operacionales
- Reusar `Cosmos` best practices no aplican directamente, pero seguir recomendaciones: retries, indexación, monitoreo.
- Indexar campos de consulta: `orgId`, `state`, `assigneeId`, `createdAt`, `orgSeq`.

## Roadmap V2 (posterior a MVP)
- Automatizaciones: reglas para creación automática de OT (por calendario, triggers, RAG), integraciones externas, dashboards avanzados, multi-tenant billing.

## Hitos, entregables y próximos pasos inmediatos
1. Documentar plan (este archivo) — Entregado.
2. Diseñar modelo de datos y endpoints (esquemas TS + OpenAPI minimal) — 1-2 días.
3. Scaffold backend (Express TS) con auth y contador por organización — 2-3 días.
4. Scaffold Ionic React (web) con Login/Register/Dashboard y páginas vacías — 2-3 días.
5. Implementar constructor de pautas (elegir librería) y preview — 3-7 días.
6. Implementar flujo de órdenes, Socket.io notificaciones y app móvil básica — 5-10 días.

---

Si quieres, puedo ahora:
- A) Generar los esquemas de MongoDB y modelos TypeScript.
- B) Crear el scaffold del backend (Express + TypeScript) con endpoints de auth y contador.
- C) Crear el scaffold del proyecto Ionic React (web + mobile) con rutas y páginas base.

Indica cuál de las opciones prefieres que empiece ahora.

---

**Estado de implementación (actualizado 2025-12-19)**

- **Hecho / Implementado:**
  - Autenticación: endpoints de registro/login/recuperación/restablecimiento, JWT y `bcrypt` implementados en backend.
  - Seed/Admin inicial creado (superadmin global) según el plan.
  - Roles & Permissions: modelo `Role` y CRUD básico implementado en backend.
  - Pautas (templates): modelo y CRUD implementados; se eliminó asignación en templates (las asignaciones se aplican a OT).
  - Órdenes de trabajo: modelo, flujo básico y contador por organización (`counters`) implementados; `findOneAndUpdate` atómico usado para `orgSeq`.
  - Archivos: almacenamiento local planificado y utilitarios presentes; límite de 5 MB manejado en la app (implementación backend para uploads disponible).
  - Realtime: `Socket.io` integrado; emisiones por room `orgId` y `user:<userId>` configuradas en backend.
  - Frontend: `AuthContext` con persistencia de token, `axios` con interceptor, páginas básicas (Login/Register/Dashboard/Templates list/preview) implementadas.

- **Parcial / En progreso:**
  - Frontend Roles: lista y placeholders están, editor de permisos (checkboxes) y CRUD completo pendiente.
  - Frontend Users: UI básica existe; integración CRUD paginada con backend pendiente.
  - ProtectedRoute: layout protege la UI, pero `ProtectedRoute` como guard de rutas está pendiente.
  - Tests: backend tiene tests básicos; tests e2e y cobertura de frontend siguen pendientes.

- **Siguientes prioridades (alineadas con STATUS):**
  1. Completar CRUD de Roles en frontend (editor de permisos y validaciones).
  2. Implementar ProtectedRoute y aplicar en rutas privadas.
  3. Finalizar Users CRUD con paginación real.
  4. Tests críticos (AuthContext, flows de login, creación de OT con contador).

Nota: se creó `STYLES.md` para centralizar referencia de estilos y guías (ver [STYLES.md](STYLES.md)).

## Actualizaciones recientes (2025-12-30)

- Entornos: `VITE_API_BASE_URL` y `VITE_SOCKET_URL` actualizados para apuntar a `http://gonzalo.ddns.net:5102` en los proyectos `app` y `frontend` (`.env.development` y `.env.production` según corresponda). También se actualizó el fallback de `axios` en `frontend/src/api/axios.ts`.
- Postman: la variable `baseUrl` en `postman/sistema-gestion.postman_collection.json` y el ejemplo en `postman/API_SUMMARY.md` ahora referencian `http://gonzalo.ddns.net:5102`.
- Git: la carpeta `app/android` fue añadida a `app/.gitignore`, removida del índice (`git rm -r --cached app/android`) y los cambios fueron commiteados y pusheados (`Ignore app/android and remove from index`). Los archivos permanecen locales pero ya no están versionados.
- Pequeñas correcciones y sincronizaciones: ajustes en `backend/src/index.ts` y otros archivos de configuración para respetar variables de entorno y URLs externas.

Estas actualizaciones son operativas y están comprometidas en la rama `main` del repositorio.
