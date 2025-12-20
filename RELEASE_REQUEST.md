# Solicitud de Release (Plantilla para IA)

Usa esta plantilla cuando quieras que la IA genere y ejecute (preparar) una nueva versión en GitHub.

Instrucciones:

- Rellena los campos obligatorios abajo.
- Cuando estés listo, añade una línea con EXACTAMENTE la frase:

  ejecuta carga en github con nueva versión

  Esa frase es el trigger: al verla, la IA tomará los datos proporcionados, generará las notas de la release, preparará los commits/tags sugeridos y devolverá las instrucciones y el contenido que subirá (o que debes ejecutar) además de dejar un registro escrito por la IA.

Plantilla (rellenar):

- **Versión nueva (tag)**: v
- **Tipo de release**: patch / minor / major
- **Resumen corto**: Breve frase de 1 línea describiendo el cambio principal.
- **Notas detalladas (bullet points)**:
  - 
  - 
  - 
- **Issues / PRs relacionados**: #123, #124 (opcional)
- **Archivos clave modificados**: lista de rutas o componentes (opcional)
- **¿Bump en package.json?**: sí / no (si corresponde indicar qué package.json)
- **¿Crear tag y push?**: sí / no
- **¿Actualizar `CHANGELOG.md`?**: sí / no
- **Fecha objetivo**: YYYY-MM-DD (opcional)

Formulario para versión 0.1.1:

- **Versión nueva (tag)**: v0.1.1
- **Tipo de release**: minor
- **Resumen corto**: Carga de nuevo release request.
- **Notas detalladas (bullet points)**:
  - Sin datos adicionales.
- **Issues / PRs relacionados**: #10, #11
- **Archivos clave modificados**: Ninguno
- **¿Bump en package.json?**: sí (root y backend)
- **¿Crear tag y push?**: sí
- **¿Actualizar `CHANGELOG.md`?**: sí

Qué hará la IA cuando detecte la frase "ejecuta carga en github con nueva versión":

1. Verificará los campos rellenados en esta plantilla.
2. Generará un `release_notes` en formato Markdown a partir de las notas detalladas y del `CHANGELOG.md` (si existe).
3. Preparará los comandos sugeridos y los mensajes de commit:
   - `chore(release): vX.Y.Z`
   - Tag anotado: `git tag -a vX.Y.Z -m "Release vX.Y.Z - resumen"`
4. Si se solicita `bump` en `package.json`, propondrá el diff del/los `package.json` y el commit correspondiente.
5. Indicará los comandos exactos a ejecutar localmente (o en CI) y generará un archivo `RELEASE_NOTES_BY_AI_vX.Y.Z.md` con el contenido que se incluirá en la GitHub Release.
6. Si confirmas, la IA puede sugerir los comandos para ejecutar aquí en tu terminal y preparar el push de tags; la ejecución real de `git push` la harás tú (o podemos automatizar si autorizas ejecutar comandos desde esta sesión).

Salida que dejará la IA (registro escrito):

- Un archivo `RELEASE_NOTES_BY_AI_vX.Y.Z.md` con el texto completo de la release.
- Un bloque de comandos `bash` listo para copiar/pegar y ejecutar.
- Un resumen de cambios que la IA guardará como registro en la respuesta.

Notas de seguridad:

- La IA no ejecuta `git push` ni cambios en remoto sin tu confirmación explícita.
- Revisa siempre las notas y commits propuestos antes de ejecutar comandos en tu repositorio.

Ejecuta este flujo así:

1. Rellena la plantilla arriba.
2. Escribe EXACTAMENTE: `ejecuta carga en github con nueva versión` en un mensaje a la IA.
3. Revisa la respuesta de la IA y ejecuta los comandos que apruebes.

Si quieres, puedo ahora crear el archivo `RELEASE_NOTES_BY_AI_v0.1.0.md` de ejemplo y preparar los comandos para `v0.1.0` usando la información que ya existe en `CHANGELOG.md` y `STATUS.md`. Responde con la plantilla rellenada o pide el ejemplo.

Archivo creado el 2025-12-19 por asistencia IA.
