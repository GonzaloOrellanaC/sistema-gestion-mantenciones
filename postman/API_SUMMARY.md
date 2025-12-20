# API Summary  Sistema de Gestión de Mantención

Breve referencia de los endpoints principales para uso en Postman o consumo por frontend.

Variables útiles
- `{{baseUrl}}`  Base URL del backend (ej. `http://localhost:5102`).
- `{{token}}`  JWT obtenido en `POST /api/auth/login` (usar en `Authorization: Bearer {{token}}`).

Autenticación
- POST `/api/auth/register`  Registrar usuario/organización.
  - Body JSON: `firstName`, `lastName`, `email`, `password`, `companyName`.
- POST `/api/auth/login`  Login.
  - Body JSON: `email`, `password`.
  - Respuesta: `{ token, user }`  usar `token` en `Authorization`.

Templates (Pautas)
- GET `/api/templates`  Listar plantillas (paginado).
  - Headers: `Authorization: Bearer {{token}}`.
- POST `/api/templates`  Crear plantilla.
  - Body JSON: `name`, `description`, `structure` (JSON con campos de la pauta).
- GET `/api/templates/:id/preview?device=mobile|desktop`  Preview de plantilla para dispositivo.

Work Orders (Órdenes de Trabajo)
- GET `/api/work-orders`  Listar OTs (filtros y paginado disponibles).
  - Headers: `Authorization: Bearer {{token}}`.
- POST `/api/work-orders`  Crear OT a partir de `templateId`.
  - Body JSON: `templateId`, `data` (según estructura de la plantilla).
  - Al crearse se asigna `orgSeq` (secuencia por organización) y estado inicial.
- PUT `/api/work-orders/:id/assign`  Asignar OT.
  - Body JSON: `assigneeId`, `note`.
- PUT `/api/work-orders/:id/start`  Marcar como iniciada (solo assignee puede iniciar según reglas).
- PUT `/api/work-orders/:id/submit`  Enviar para aprobación (workflow según permisos).
- PUT `/api/work-orders/:id/approve`  Aprobar OT.
- PUT `/api/work-orders/:id/reject`  Rechazar OT (incluir motivo).

Archivos y adjuntos
- POST `/api/files/upload`  Subir archivo (genérico) y generar `FileMeta`.
  - Headers: `Authorization: Bearer {{token}}`.
  - Form-data: `file` (archivo), `type` (texto, p.ej. `work_order_photos`, `reports`).
  - Tamaño máximo: 5 MB (configuración de backend). Tipos permitidos: jpg, png, pdf, doc, docx.
  - Si es imagen, se genera thumbnail (`meta.thumbnailPath`).
- POST `/api/work-orders/:id/attachments`  Adjuntar archivo a una OT.
  - Igual a `files/upload` pero asocia el `FileMeta` a la OT indicada.

Usuarios y roles
- CRUD de usuarios y roles disponibles en endpoints protegidos (rehusar `Authorization`).
- Roles incluyen permisos; hay rol `Owner` por defecto en cada organización.

Notificaciones y realtime
- Socket.io está disponible en el backend; los clientes deben unirse a rooms:
  - `org:<orgId>`  notificaciones por organización.
  - `user:<userId>`  notificaciones privadas por usuario.

Ejemplos rápidos para Postman
- Crear usuario (POST): `{{baseUrl}}/api/auth/register` (JSON)
- Login (POST): `{{baseUrl}}/api/auth/login`  copiar `token` a variable `{{token}}`.
- Subir foto y adjuntar a OT (form-data):
  - `POST {{baseUrl}}/api/work-orders/:id/attachments` con campos `file` y `type=work_order_photos`.

Notas de operación
- Fechas y horarios: UTC por defecto.
- Archivos se almacenan en `backend/files/{orgId}/{type}/` (ruta relativa en servidor).
- Si Mailgun no está configurado, los correos se registran en `EmailLog` para desarrollo.

Si quieres, puedo:
- Importar la colección JSON en Postman y añadir ejemplos/variables más detalladas.
- Añadir una sección de ejemplos curl o snippets para Ionic/Angular.

Archivo relacionado en workspace
- `postman/sistema-gestion.postman_collection.json`  colección JSON con peticiones principales.

----
Fecha: 2025-12-20
