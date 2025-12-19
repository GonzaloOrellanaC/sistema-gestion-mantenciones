# Resumen de estilos y tema

Breve resumen de dónde están los estilos del proyecto, tokens de tema y recomendaciones de uso.

- **Hoja global principal:** `src/styles.css` — estilos base de la app web, variables CSS globales y overrides menores de Ionic.
- **Tokens y tema:** `src/theme/` — carpeta con tokens/variables (colores, tipografías, espaciados) y utilidades para components. Usar estos tokens para consistencia.
- **Guías de estilo del frontend:** `frontend/STYLE_GUIDELINES.md` — reglas y convenciones para componentes, nomenclatura y accesibilidad.
- **Notas de diseño / archivo de referencia:** `app/App.estilos.txt` y `App.txt` — apuntes y decisiones de estilo históricas (útiles como referencia de intención de diseño).

Recomendaciones prácticas:

- Usar variables del tema en `src/theme` siempre que sea posible; evitar repetir valores en componentes.
- Añadir nuevas variables al tema cuando haga falta (colores, tamaños, tokens semánticos) en lugar de usar valores hex puntuales.
- Preferir clases y variables CSS sobre estilos inline para facilitar overrides por plataforma (web vs mobile).
- Mantener las adaptaciones responsivas en el renderer (preview) y en `src/styles.css` usando media queries o utilitarios ya presentes en `src/theme`.
- Comprimir/optimizar imágenes antes de subir; limitar tamaño y usar thumbnails para listados.

Dónde buscar cambios futuros:

- Si se adopta un sistema de design tokens (Tailwind/CSS-in-JS), sincronizar `frontend/STYLE_GUIDELINES.md` y `src/theme`.
- Para la app móvil (Ionic/Capacitor) seguir tokens comunes y sobrescribir variables de Ionic en el scope móvil.

Este archivo se creó como resumen técnico el 2025-12-19 para centralizar referencias de estilos existentes.
