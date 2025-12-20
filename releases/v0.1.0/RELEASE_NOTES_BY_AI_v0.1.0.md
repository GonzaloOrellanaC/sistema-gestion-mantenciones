# Release v0.1.0

Fecha: 2025-12-19

Resumen corto
----------------
Inicialización del MVP con autenticación, plantillas (pautas), contador de órdenes por organización y funcionalidades básicas del frontend para gestión de sesiones y visualización de plantillas.

Highlights
----------------
- Endpoints de autenticación: registro, login, recuperar contraseña y restablecer contraseña (JWT, `bcrypt`).
- Seed: superadmin global creado en el seed inicial.
- Modelos principales implementados: `Template`, `WorkOrder`, `Role`, `counters` (contador por `orgId`).
- Contador por organización (`orgSeq`) implementado con operación atómica `findOneAndUpdate` para asegurar unicidad.
- Integración de `Socket.io` para notificaciones en tiempo real por `orgId` y `user:<userId>`.
- Frontend: `AuthContext` con persistencia de token, `axios` con interceptor `Authorization`, y páginas básicas (Login, Register, Dashboard, TemplatesList, TemplatePreview).
- Manejo de archivos: utilitarios para uploads y regla de límite de 5 MB por archivo (implementación backend disponible y pautas en el plan).

Cambios importantes
----------------
- Se eliminó la asignación directa desde `templates`; la asignación ahora se aplica a las Órdenes de Trabajo generadas a partir de una plantilla.
- `workOrdersService.createWorkOrder` ahora acepta `assigneeId` o `assigneeRole` y crea la OT con estado `Asignado` cuando corresponde.
- Añadido `GET /api/auth/me` para resolver la carga inicial del usuario desde token.

Correcciones
----------------
- Evitado el comportamiento que provocaba pérdida del token por submit nativo en el formulario de `Login` (frontend).

Notas para Operaciones / Migraciones
----------------
- No se requieren migraciones de esquema para esta release; sin embargo, la numeración de OT por organización depende de la colección `counters`. Asegurarse de que la colección exista y que la operación `findOneAndUpdate` tenga permisos para `upsert`.
- Revisar variables de entorno relacionadas con correos (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`) si se habilitan notificaciones por email.

Checklist antes de publicar
----------------
- [ ] Ejecutar tests en backend y frontend.
- [ ] Ejecutar builds (`npm run build`) donde corresponda.
- [ ] Confirmar bump de versión en `package.json` (root y backend si aplica).
- [ ] Commit con mensaje `chore(release): v0.1.0` y creación de tag anotado `v0.1.0`.
- [ ] Push de commits y tags a `origin`.
- [ ] (Opcional) Crear GitHub Release con estas notas.

Archivos clave relacionados (ejemplos):
- `backend/src/controllers/authController.ts`
- `backend/src/services/workOrdersService.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/api/templates.ts`

Referencias en repo
----------------
- CHANGELOG: `CHANGELOG.md` (sección Unreleased contenía las entradas base para esta versión).
- Estado y notas del proyecto: `STATUS.md`.
- Política de versionado: `VERSIONING.md`.

Notas finales
----------------
Estos release notes fueron generados por la IA usando `CHANGELOG.md` y `STATUS.md` como fuente de verdad. Revisa y ajusta antes de publicar.
