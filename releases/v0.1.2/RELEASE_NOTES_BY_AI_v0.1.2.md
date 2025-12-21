# Release v0.1.2

Fecha: 2025-12-21

Resumen de cambios principales:

- Backend:
  - Añadido periodo de prueba de 30 días al crear una organización (`trialStartsAt`, `trialEndsAt`, `isPaid`).
  - `registerUser` inicializa el trial de 30 días al crear la organización.
  - `loginUser` bloquea el inicio de sesión (HTTP 402) si el trial expiró y la organización no ha pagado.
  - `/me` ahora devuelve la información de trial para que el frontend la muestre.

- Frontend:
  - Mensajes visibles sobre los 30 días de prueba en `Register`, `Login` y `Landing`.
  - Banner y modal en el menú lateral (`MainLayout`) para administradores con días restantes y fecha de renovación.
  - Creación e integración de `FileUploader` widget (subida de fotos/documentos) y páginas para `Supplies` / `SupplyCreate`.
  - `AssetCreate` soporta ahora subida de foto y documento (se envía `FormData`).
  - Refactor: agrupación y ajustes en permisos (roles), añadido permiso `ejecutarOT`, agregado `crearUsuarios` y eliminación de permisos obsoletos.
  - Utilidad `sortByName` añadida y aplicada para ordenar listas alfabéticamente.

- Otros:
  - Varios archivos añadidos y refactorizados para consistencia en uploads y listados.

Notas de despliegue / verificación:

- Ejecutar migración ligera si es necesario para que las organizaciones nuevas obtengan `trial*` fields (las nuevas orgs se crean con campos de trial por defecto).
- Probar:
  1. Registrar una nueva organización → comprobar `/me` devuelve `trialStartsAt`/`trialEndsAt`.
  2. Intentar login tras expirar el trial → backend debe responder 402 y mensaje explicativo.
  3. Verificar banner y modal en menú para administrador.
  4. Crear y subir insumos/activos con fotos y documentos.

Riesgos / tareas pendientes:

- Integrar pasarela de pagos para marcar `isPaid=true` (no incluido en esta versión).
- Añadir soporte visual de progreso de subida y gestión de errores en uploads (mejora UX).
- Ejecutar build y test end-to-end en entorno de staging.

Archivos añadidos en este release (selección):

- `backend/src/models/Organization.ts` (trial fields)
- `backend/src/services/authService.ts` (register/login trial handling)
- `backend/src/controllers/authController.ts` (`/me` enhanced)
- `frontend/src/components/MainLayout.tsx` (banner + modal)
- `frontend/src/components/Widgets/FileUploader.widget.tsx` (nuevo)
- `frontend/src/pages/Supplies.tsx`, `frontend/src/pages/SupplyCreate.tsx`
- `frontend/src/pages/AssetCreate.tsx` (uploads)
- `frontend/src/utils/sort.ts`

-- Fin de notas
