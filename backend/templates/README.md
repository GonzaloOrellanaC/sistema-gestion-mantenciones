Plantillas de correo utilizadas por el backend.

Placeholders disponibles (usar tal cual, reemplazarlos desde el backend antes de enviar):

- `{{logoUrl}}` : URL pública del logo. Por defecto se espera que el logo esté disponible en la web desde la ruta del frontend: `/assets/sgm-logo.svg` (archivo local: `frontend/public/assets/sgm-logo.svg`).
- `{{name}}` : Nombre del destinatario (opcional).
- `{{confirmLink}}` : Enlace para confirmar la cuenta (bienvenida).
- `{{resetLink}}` : Enlace para restablecer la contraseña (restaurar contraseña).
- `{{subject}}` : Asunto del correo (usado en plantillas genéricas si se desea).
- `{{message}}` : Contenido HTML o texto para plantillas de notificación.

Notas:
- Estas plantillas usan estilos inline sencillos inspirados en los estilos globales del frontend (`--primary: #89C2D9`, fondo claro y tipografía sistema). Asegúrate de pasar `logoUrl` como URL absoluta accesible desde Internet si el backend se ejecuta desde un servidor o contenedor.
- Si quieres que el backend cargue estas plantillas automáticamente, puedes leer los archivos desde `backend/templates` y reemplazar los placeholders con los valores reales antes de pasarlos a `mailer.sendNotificationEmail` o funciones equivalentes.
