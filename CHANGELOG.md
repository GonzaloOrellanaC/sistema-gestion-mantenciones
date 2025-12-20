# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.
El formato sigue "Keep a Changelog" adaptado y SemVer.

## [Unreleased]

### Added
- Autenticación: endpoints de registro/login/forgot/reset con JWT y `bcrypt` (backend).
- Seed: superadmin global creado en el seed inicial.
- Modelos básicos: `Role`, `Template`, `WorkOrder`, `counters` (contador por `orgId`).
- Frontend: `AuthContext` con persistencia de token y `axios` con interceptor de `Authorization`.
- Frontend: páginas básicas implementadas: `Login`, `Register`, `Dashboard`, `TemplatesList`, `TemplatePreview`.
- Realtime: `Socket.io` integrado y habitaciones por `orgId` y `user:<userId>`.
- Archivos: utilitarios y límite de tamaño implementados (uploads locales; 5 MB por archivo planificado).

### Changed
- Templates: removida la asignación directa en `templates`; las asignaciones ahora aplican a las Órdenes de Trabajo.
- `workOrdersService.createWorkOrder` acepta `assigneeId` o `assigneeRole` y crea OT con estado `Asignado` cuando corresponde.
- Ajustes en el flujo frontend para evitar pérdida de token al hacer submit en `Login`.

### Fixed
- Endpoint `GET /api/auth/me` añadido para resolver carga inicial del usuario desde token.

### Deprecated
- Ninguna de momento.

### Removed
- Endpoint `/api/templates/:id/assign` eliminado (asignación no pertenece a templates inicialmente).

## Release history

## [v0.1.1] - 2025-12-19

### Added
- Carga de nuevo release request (metadatos y preparación de release manual).

### Changed
- Actualización de `CHANGELOG.md` con nueva entrada para `v0.1.1`.

### Fixed
- Ninguno específico.

## [Unreleased]

### Added
- (continuación de entradas planificadas para próximas releases)

## How to release

1. Actualizar las secciones bajo `[Unreleased]` y moverlas a una nueva cabecera `## [vX.Y.Z] - YYYY-MM-DD`.
2. Bump de versión en `package.json` (si aplica) o usar `git tag` con el formato `vMAJOR.MINOR.PATCH`.
3. Ejecutar tests y build.
4. Crear tag anotado y push de commits y tags.

Ejemplo rápido:

```bash
npm version patch
git push origin main --follow-tags
```

Notas:
- Para detalles sobre la política de versionado y checklist de release, ver [VERSIONING.md](VERSIONING.md).

Archivo generado el 2025-12-19 basándose en `STATUS.md` y `PLAN.md`.
