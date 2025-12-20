# Sistema de Gestión de Mantención

> Monorepo para una aplicación de gestión de mantención que incluye la app móvil/web, frontend, y backend.

Descripción
-----------
Este repositorio contiene el código fuente de un sistema para gestionar tareas y mantenciones, con una interfaz de cliente (Ionic/React + Vite), una app móvil (Capacitor) y un servicio backend (Node.js). Está organizado para permitir desarrollo independiente y despliegue de cada componente.

Características principales (resumen)
- Gestión de órdenes de trabajo (crear, asignar, cerrar)
- Administración de inventario y repuestos
- Autenticación y roles de usuario
- Reportes y exportes

Estructura del repositorio
--------------------------
- `app/` — Proyecto móvil (Capacitor) y configuración Android/iOS.
- `frontend/` — Interfaz de usuario principal (Ionic + Vite / React).
- `backend/` — API y servicios (Node.js, Express u otro framework JS).
- `postman/` — Colecciones y documentación de la API para pruebas.
- `releases/` — Scripts y notas de release.

Requisitos
----------
- Node.js 18+ (o versión LTS compatible)
- npm o yarn
- Java JDK + Android SDK (para compilación móvil Android)
- Opcional: Docker (si se usan contenedores para servicios)

Instalación y ejecución (desarrollo)
-----------------------------------
Desde la raíz del repositorio puedes instalar dependencias globales y luego cada subproyecto:

Instalar dependencias raíz (opcional):

```bash
npm install
```

Backend:

```bash
cd backend
npm install
# Ejecutar en modo desarrollo (ajusta el script si tu package.json usa otro nombre)
npm run dev
```

Frontend (web):

```bash
cd frontend
npm install
npm run dev
# o: npm start (según scripts definidos)
```

App móvil (Capacitor):

```bash
cd app
npm install
npx cap sync
# Para abrir Android Studio
npx cap open android
# Para ejecutar en un emulador o dispositivo usar Android Studio o los comandos de Capacitor
```

Pruebas
-------
Cada subproyecto puede tener su propia configuración de tests. Ejemplo:

```bash
cd backend
npm test

cd frontend
npm test
```

Build y despliegue
------------------
- Para producción, ejecutar el script de build correspondiente en cada paquete (`npm run build`).
- Revisar `releases/` para scripts y notas de release.

Contribuir
----------
- Abrir un issue para proponer cambios o reportar errores.
- Crear ramas con prefijo `feature/` o `fix/` y enviar PRs con descripción clara.

Notas adicionales
-----------------
- Revisa `postman/` para ejemplos de requests a la API.
- Usa el emulador de Android o dispositivos reales para probar la app móvil.

Contacto
-------
Para dudas o coordinación, abre un issue en este repositorio.

---
_Generado automáticamente: este README ofrece una vista de alto nivel. Si quieres, puedo adaptar las instrucciones a los scripts exactos de `package.json` de cada carpeta, comprobar comandos y actualizarlo._
