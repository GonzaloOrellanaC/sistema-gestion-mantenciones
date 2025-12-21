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


## Tokens de color recomendados

A continuación se proponen variables CSS y mapeos para usar en el frontend (web) y, en consecuencia, sobrescribir o mapear en la app (Ionic/Capacitor). Los valores fueron ajustados para reflejar la paleta pastel azul del logo (`frontend/public/assets/sgm-logo.svg`) y el gris-azulado del logotipo de texto.

- Frontend (variables globales — sugerir definir en `src/styles.css`):

	- `--color-primary`: #89C2D9    /* Azul pastel (isotipo) */
	- `--color-primary-variant`: #A7E3EB /* Celeste claro (gradiente) */
	- `--color-primary-gradient`: linear-gradient(135deg,#89C2D9 0%,#A7E3EB 100%)
	- `--color-secondary`: #A7E3EB  /* Variante suave */
	- `--color-tertiary`: #4A5568   /* Gris-azulado (texto/logo) */
	- `--color-danger`: #DC3545
	- `--color-warning`: #F59E0B

	- `--bg-default`: #FFFFFF
	- `--bg-surface`: #F8FAFC
	- `--bg-muted`: #F1F5F9

	- `--text-primary`: #4A5568  /* usar el gris-azulado para encabezados y logotipo */
	- `--text-secondary`: #334155
	- `--text-muted`: #64748B

	Ejemplo (en `:root`):

	```css
	:root {
		--color-primary: #89C2D9;
		--color-primary-variant: #A7E3EB;
		--color-primary-gradient: linear-gradient(135deg,#89C2D9 0%,#A7E3EB 100%);
		--color-secondary: #A7E3EB;
		--color-tertiary: #4A5568;
		--color-danger: #DC3545;
		--color-warning: #F59E0B;

		--bg-default: #FFFFFF;
		--bg-surface: #F8FAFC;
		--bg-muted: #F1F5F9;

		--text-primary: #4A5568;
		--text-secondary: #334155;
		--text-muted: #64748B;
	}
	```

- App (Ionic / Capacitor): mapear las variables de Ionic a las del frontend o sobrescribir en `src/theme/variables.css` o `variables.scss`:

	- `--ion-color-primary`: var(--color-primary)
	- `--ion-color-primary-contrast`: #FFFFFF
	- `--ion-color-secondary`: var(--color-secondary)
	- `--ion-color-tertiary`: var(--color-tertiary)
	- `--ion-color-danger`: var(--color-danger)
	- `--ion-color-warning`: var(--color-warning)

	- `--ion-background-color`: var(--bg-default)
	- `--ion-surface-color`: var(--bg-surface)

	- `--ion-text-color`: var(--text-primary)
	- `--ion-text-color-secondary`: var(--text-secondary)

Uso recomendado:

- Definir las variables del frontend en `src/styles.css` (o `:root`) y referenciar esas variables en componentes.
- Para la app móvil, mapear las variables de Ionic a las variables del frontend para mantener consistencia entre plataformas.
- Añadir variantes (hover, active, 10–20% más oscuro/ligero) si se necesitan estados accesibles.

Este archivo se creó como resumen técnico el 2025-12-19 para centralizar referencias de estilos existentes.
