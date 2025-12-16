# Backend — Sistema de Gestión (Scaffold)

Ruta: `backend/`

Instalación (PowerShell):

```powershell
cd C:\Users\gorel\Documents\Personales\sistema-gestion-mantencion\backend
npm install
cp .env.example .env
# editar .env con MONGO_URI, JWT_SECRET, MAILGUN_API_KEY/MAILGUN_DOMAIN si aplica
npm run dev
```

Puertos por convención en este proyecto:

- Frontend (web admin Ionic React): `http://localhost:5100`
- App móvil (Ionic React / Capacitor dev server): `http://localhost:5101`
- Backend (Express): `http://localhost:5102`

Sugerencia para iniciar frontend/app con puertos específicos (PowerShell):

```powershell
# En el directorio del frontend web (si usas Ionic):
ionic serve --port 5100 --open

# En el directorio de la app (si quieres correr un dev server separado):
ionic serve --port 5101 --open

# Backend (desde backend/)
npm run dev
```

Nota: el backend utiliza la variable `FRONTEND_URL` para construir links de recuperación de contraseña; por defecto en `.env.example` está `http://localhost:5100`.

Puntos importantes:
- Endpoints iniciales:
  - `POST /api/auth/register` — body: `{ firstName, lastName, email, password, companyName }`
  - `POST /api/auth/login` — body: `{ email, password, companyName }`
  - `POST /api/auth/forgot-password` — body: `{ email, companyName }` (envía link de restauración)
  - `POST /api/auth/reset-password` — body: `{ token, newPassword }` (restablece contraseña)
  - `POST /api/counters/:orgId/next` — devuelve `{ next: number }`
- La creación de organización y rol Admin se maneja automáticamente en `/auth/register`.
- La colección `counters` es usada para secuencias por organización con operación atómica `findOneAndUpdate`.

Siguientes pasos sugeridos:
- Añadir validaciones más estrictas y manejo de errores completo.
- Implementar recuperación y restauración de password (forgot/reset).
- Añadir endpoints CRUD para `roles`, `users`, `templates`, `work_orders`.
- Integrar Mailgun y subir archivos (GridFS o S3) según preferencia.
