Carpeta `releases/`

Estructura destinada a almacenar releases y artefactos relacionados.

Convención:
  - `RELEASE_NOTES_BY_AI_<version>.md` : notas de la release generadas por IA.
  - `RELEASE_COMMANDS_<version>.sh` : script bash sugerido para publicar la release.
  - `RELEASE_COMMANDS_<version>.ps1` : script PowerShell sugerido (si aplica).

Flujo recomendado:
1. Revisar `RELEASE_NOTES_BY_AI_<version>.md`.
2. Ejecutar los tests localmente y verificar builds.
3. Ejecutar el script apropiado o aplicar manualmente los pasos.
4. Crear Release en GitHub desde el tag correspondiente o usando `gh`.

Nota: Los archivos originalmente creados en la raíz fueron movidos/copiados a `releases/` y las versiones en la raíz ahora contienen referencias a las ubicaciones dentro de `releases/`.
Archivos movidos:
- `RELEASE_NOTES_BY_AI_v0.1.0.md` -> `releases/v0.1.0/RELEASE_NOTES_BY_AI_v0.1.0.md`
- `RELEASE_COMMANDS_v0.1.0.sh` -> `releases/v0.1.0/RELEASE_COMMANDS_v0.1.0.sh`
- `RELEASE_NOTES_BY_AI_v0.1.1.md` -> `releases/v0.1.1/RELEASE_NOTES_BY_AI_v0.1.1.md`
- `RELEASE_COMMANDS_v0.1.1.sh` -> `releases/v0.1.1/RELEASE_COMMANDS_v0.1.1.sh`
- `RELEASE_COMMANDS_v0.1.1.ps1` -> `releases/v0.1.1/RELEASE_COMMANDS_v0.1.1.ps1`

Si prefieres que elimine completamente las entradas en la raíz, puedo borrarlas completamente (ahora contienen solo referencias).
