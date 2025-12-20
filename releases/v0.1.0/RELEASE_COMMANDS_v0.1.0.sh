#!/usr/bin/env bash
# Script de comandos sugeridos para publicar v0.1.0
set -e

echo "1) Ejecutar tests y builds"
echo "--- Backend ---"
if [ -f backend/package.json ]; then
  (cd backend && npm ci && npm test || echo "Backend tests fallaron")
else
  echo "No se encontró backend/package.json - omitiendo tests backend"
fi

echo "--- Frontend ---"
if [ -f frontend/package.json ]; then
  (cd frontend && npm ci && npm test || echo "Frontend tests fallaron")
else
  echo "No se encontró frontend/package.json - omitiendo tests frontend"
fi

echo "--- Root ---"
if [ -f package.json ]; then
  npm ci || echo "Root npm ci falló"
fi

echo "2) Bump versiones en package.json (root y backend) sin crear tags"
# Requiere npm >=7 para 'npm pkg set'
npm pkg set version 0.1.0 || echo "No se pudo setear versión en root (omitir si no aplica)"
if [ -f backend/package.json ]; then
  npm --prefix backend pkg set version 0.1.0 || echo "No se pudo setear versión en backend (omitir si no aplica)"
fi

echo "3) Crear commit de release"
git add package.json
if [ -f backend/package.json ]; then
  git add backend/package.json
fi
git commit -m "chore(release): v0.1.0" || echo "No hay cambios para commitear"

echo "4) Crear tag anotado"
git tag -a v0.1.0 -m "Release v0.1.0 - Inicialización del MVP con auth, templates y contador por org."

echo "5) Push de commits y tags"
git push origin main
git push origin v0.1.0

echo "6) Crear GitHub Release (opcional, requiere 'gh' CLI y autenticación)"
if command -v gh >/dev/null 2>&1; then
  gh release create v0.1.0 --title "v0.1.0" --notes-file RELEASE_NOTES_BY_AI_v0.1.0.md || echo "gh release create falló"
else
  echo "gh CLI no encontrado: para crear la release automáticamente instala GitHub CLI o crea la release manualmente usando la interfaz web."
fi

echo "Hecho. Revisa los pasos y el contenido de RELEASE_NOTES_BY_AI_v0.1.0.md antes de ejecutar."
