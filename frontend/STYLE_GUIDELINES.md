# Pautas de Diseño - Frontend

Propósito: centralizar decisiones de UI/UX y normas técnicas para mantener coherencia visual en la aplicación.

## 1. Paleta de colores
- Primary: `#0B67B3` (degradado hacia `#37A3F3` para fondos destacados)
- Secondary: `#0288D1`
- Accent: `#81D4FA`
- Surface / Neutral: `#FFFFFF`, `#F5F7FA`, `#ECEFF1`
- Text primary: `#263238` ; Text muted: `#607D8B`

Variables sugeridas (CSS):
```
:root {
  --color-primary: #0B67B3;
  --color-primary-2: #37A3F3;
  --color-secondary: #0288D1;
  --color-surface: #FFFFFF;
  --color-muted: #607D8B;
}
```

## 2. Tipografía
- Familia: `Segoe UI, Roboto, Arial, sans-serif`.
- Escala recomendada:
  - H1: 32px
  - H2: 24px
  - H3: 20px
  - Body: 16px
  - Small / helper: 12px

## 3. Espaciado y layout
- Sistema modular basado en 8px (4, 8, 12, 16, 24, 32, ...).
- Contenedores: máximo 1200px; los cards principales centrados con paddings internos de 24px.

## 4. Botones
- Primary: fondo `--color-primary`, texto blanco, radio 8px, padding vertical 12px.
- Secondary / ghost: fondo transparente, borde `--color-primary`, texto `--color-primary`.

Clases CSS sugeridas:
```
.btn { border-radius: 8px; padding: 10px 16px; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-secondary { border: 1px solid var(--color-primary); color: var(--color-primary); background: transparent; }
```

## 5. Formularios e inputs
- Fuente de verdad: `frontend/src/components/Inputs/Input.widget.tsx` — NO modificar a menos que se acuerde globalmente.
- Norma de uso:
  - Siempre usar el componente `Input` del proyecto.
  - Pasar `label` como prop; no envolver con `IonLabel` ni `IonItem`.
  - Validación: mostrar mensajes de error debajo del campo con color `danger` y rol `alert` para accesibilidad.
  - Espaciado entre campos: `margin-bottom: 12px`.

Ejemplo de uso (React):
```
<div className="form-field">
  <Input label="Correo" type="email" value={email} onInput={(e:any)=>setEmail(e.detail?.value ?? '')} name="email" />
</div>
```

## 6. Auth card (login / register / forgot)
- Clase: `.auth-card` mantiene ancho máximo y centrado en pantallas.
- Logo: usar `/assets/sgm-logo.svg` (isotipo) con altura recomendada entre `64px` y `120px` según contexto.
- Encabezados: H3 para título del card.

Ejemplo mínimo HTML structure:
```
<div class="auth-card">
  <div class="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM"/></div>
  <h3>Título</h3>
  <form>...</form>
</div>
```

## 7. Logo y uso de marca
- Isotipo (`sgm-logo.svg`) para espacios pequeños y favicons.
- Logotipo horizontal (opcional) para barras y cabeceras: `sgm-logotype.svg`.
- Zona de protección: dejar espacio libre de al menos 1x el alto del isotipo alrededor.
- No estirar ni recolorear sin variantes oficiales.

## 8. Responsive
- Breakpoints sugeridos: `xs < 576px`, `sm >=576`, `md >=768`, `lg >=992`, `xl >=1200`.
- En `.auth-card` usar `max-width: 480px` en móviles y `max-width: 700px` en escritorio mediano.

## 9. Accesibilidad
- Form fields: usar `aria-label` si el label no es visible y `aria-describedby` para errores.
- Contraste mínimo WCAG AA para textos principales.

## 10. Assets y export
- Mantener SVGs en `frontend/public/assets/` y versiones PNG/ICO si es necesario.
- Añadir variantes: `sgm-logo-monochrome.svg`, `sgm-logotype.svg`.

## 11. Ejemplos y patrones de código
- Incluir snippets para botones, modals, y llamadas a API con manejo de errores y mensajes de usuario.

## 12. Contribuir y checklist
- Antes de PR:
  - Revisar consistencia de colores y tipografías.
  - Probar en móvil y escritorio.
  - Ejecutar linter y tests (`npm run lint`, `npm test`).

---
Próximos pasos propuestos: generar las variantes de logo (monocromo y horizontal), generar un archivo `variables.css` global con las variables listadas, y aplicar pequeñas refactorizaciones a `login.css` para usar variables.
