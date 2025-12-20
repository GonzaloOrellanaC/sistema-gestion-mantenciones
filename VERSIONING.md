# Política de Versionado y Proceso de Release

Propósito: centralizar la convención de versiones, flujo de ramas y checklist mínimo para publicar releases del proyecto.

1) Convención de versiones
- Usar Semantic Versioning (SemVer): MAJOR.MINOR.PATCH
  - MAJOR: cambios incompatibles en la API o migraciones de datos.
  - MINOR: nuevas features compatibles hacia atrás.
  - PATCH: correcciones de bugs y cambios menores.

2) Flujo de ramas (sugerido)
- `main` o `master`: rama estable y deployable.
- `develop` (opcional): integración diaria; merge a `main` para releases.
- `feature/*`: ramas de nuevas features (originadas desde `develop` o `main`).
- `fix/*` o `hotfix/*`: correcciones urgentes (pueden mergearse directo a `main`).

3) Etiquetado y nombres de release
- Tags con `vMAJOR.MINOR.PATCH`, p.ej. `v1.4.2`.
- Usar mensajes de tag con resumen corto y referencia a la issue/PR.

4) Checklist mínimo antes de release
- Ejecutar tests: `npm test` (backend/frontend según corresponda).
- Actualizar `CHANGELOG.md` / notas de la release (ver plantilla abajo).
- Bump de versión en `package.json` (si aplica) y commit con mensaje `chore(release): vX.Y.Z`.
- Crear tag anotado: `git tag -a vX.Y.Z -m "Release vX.Y.Z - resumen"`.
- Push de commits y tags: `git push origin main && git push origin --tags`.

5) Plantilla rápida para `CHANGELOG.md` (convención Keep a Changelog básica)

## [Unreleased]

### Added
- Nueva funcionalidad A

### Changed
- Cambios en B

### Fixed
- Corrección C

### Release X.Y.Z - YYYY-MM-DD
- Resumen breve de la release

6) Comandos útiles
- Bump & commit manual:

```
npm version patch # o minor/major
git push origin main --follow-tags
```

- Crear tag manualmente:

```
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

7) Releases automatizadas (opcional)
- Recomiendo usar GitHub Actions para crear releases automáticas cuando se hace push de un tag `v*`:
  - Workflow: detecta tag `v*`, ejecuta tests, construye artefactos y crea GitHub Release.

8) Buenas prácticas de commits
- Usar mensajes claros y tipo-convención (opcional): `feat:`, `fix:`, `chore:`, `docs:`.
- Referenciar issue/PR: `feat(auth): add login reCAPTCHA (#123)`.

9) Notas operativas
- Para releases que cambian esquema de DB, documentar migraciones y avisar a ops/users.
- Mantener `CHANGELOG.md` en la raíz y actualizar en cada release.

Si quieres, puedo:
- A) Añadir un workflow de GitHub Actions de ejemplo para automatizar releases.
- B) Crear/actualizar `CHANGELOG.md` con historial actual.

Este archivo fue creado el 2025-12-19.
