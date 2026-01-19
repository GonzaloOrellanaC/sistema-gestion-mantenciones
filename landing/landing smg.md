# **Prompt Maestro para Landing Page de Sistema de Mantenimiento Integral (Frontend React — Monorepo)**

**Rol:** Actúa como un experto Diseñador UI/UX y Desarrollador Frontend Senior, especializado en productos SaaS B2B y Enterprise.

**Tarea:** Generar la especificación y el archivo de diseño para la Landing Page de una **Plataforma de Gestión de Mantenimiento y Órdenes de Trabajo**. El sistema incluye una Aplicación Web (Gestión) y Apps Móviles (Ejecución/Bodega). Esta versión del prompt debe orientar la implementación en un monorepo donde el frontend es una aplicación **React** (Vite o CRA) y el backend (en el mismo monorepo) arranca sirviendo el `index.html` resultante que queda en `dist/` tras el build del frontend.

## **1\. Stack Tecnológico (React · Monorepo)**

- **Core Frontend:** React (preferible con Vite + React, compatible también con Create React App). Usar componentes React y bibliotecas para UI y comportamiento.
- **Construcción / Bundling:** Vite (recomendado) o CRA build para generar `dist/` o `build/` según la herramienta elegida.
- **Estilos:** Tailwind CSS (integrado en el proyecto React vía PostCSS / Tailwind config). Para prototipos rápidos se puede usar CDN, pero el objetivo final es integrar Tailwind en la app React.
- **Iconos:** Phosphor Icons (paquete NPM o CDN).
- **Animaciones:** AOS (opcional) o librerías de animación React (Framer Motion) para transiciones suaves.
- **Carrusel:** Swiper.js (usar la integración para React: `swiper/react`).

Notas de Monorepo:
- Estructura sugerida del monorepo: `packages/frontend` (React Vite/CRA), `packages/backend` (Node + Express). Alternativamente `apps/frontend` y `apps/backend`.
- El `frontend` debe exponer un script de build que genere la salida estática en `packages/frontend/dist` (o `apps/frontend/dist`, o `build/` si CRA).
- El `backend` al iniciar debe servir estáticamente `dist/index.html` (o `build/index.html`) y devolverlo como fallback para rutas SPA.

## **2\. Dirección de Arte & UI**

* **Tema:** "Enterprise Clean & Modern" (Light Mode). Debe transmitir limpieza, eficiencia y orden.  
* **Paleta de Colores (Basada en Variables Ionic):**  
  * **Fondo Principal:** \#FFFFFF (Blanco puro) y \#F8FAFC (Slate muy suave para secciones alternas).  
  * **Primario:** \#89C2D9 (Azul Cielo Suave) \- Usar para botones principales y elementos destacados.  
  * **Secundario:** \#A7E3EB (Cian Pálido) \- Usar para fondos de iconos o acentos sutiles.  
  * **Texto Principal:** \#4A5568 (Gris Pizarra Oscuro) \- Para títulos y cuerpos de texto. Legibilidad máxima.  
  * **Acentos:** \#E8F0FE (Variante primaria) para hover states o fondos de tarjetas.  
* **Estilo Visual:**  
  * **Sombras Suaves:** shadow-lg pero con opacidad baja para dar profundidad sin ensuciar (estilo "Soft UI").  
  * **Bordes Redondeados:** rounded-xl o rounded-2xl para una sensación amigable y moderna.  
  * **Gradientes:** Muy sutiles, usando la gama de azules del sistema, nada agresivo.

## **3\. Estructura de la Página (Secciones)**

### **A. Navbar (Sticky & Clean)**

* Fondo blanco con backdrop-blur-md ligero y borde inferior sutil (border-slate-100).  
* Logo a la izquierda (imagina un logo técnico/industrial).  
* Enlaces: "Funcionalidades", "Plataformas", "Sectores", "Contacto".  
* Botón CTA: "Solicitar Demo" (Color \#89C2D9 texto blanco o gris oscuro según contraste).

### **B. Hero Section (Ecosistema Multiplataforma)**

* **Texto (Izquierda):**  
  * H1: "Control Total de Mantenimiento, Inventario y Activos".  
  * Subtítulo: "Gestiona desde la Web, ejecuta en Terreno. La solución integral para órdenes de trabajo, inspecciones y gestión de bodega."  
  * CTA: "Ver Dashboard" y "Descargar App".  
* **Visual (Derecha):**  
  * **Composición Hero:** Debe mostrar una **Laptop** (Dashboard Web con gráficos) detrás de una **Tablet** (Lista de Chequeo) y un **Smartphone** (Escaneo de repuesto).  
  * Usa CSS Shapes o Placeholders estilizados para representar estos dispositivos si no hay imágenes, o deja los img placeholders listos.

### **C. Solución Integral (Grid de Beneficios)**

* Título: "Todo lo que tu operación técnica necesita".  
* Tarjetas limpias (fondo blanco, sombra suave) destacando:  
  1. **Gestión de Activos:** Historial de vida de máquinas, vehículos y equipos.  
  2. **Control de Stock Inteligente:** Avisos de renovación y consumo de repuestos en tiempo real.  
  3. **Órdenes de Trabajo (OT):** Flujo completo desde la solicitud hasta el cierre.  
  4. **Dashboards Visuales:** Análisis de frecuencia y gráficas de estado.

### **D. Workflow Section (Paso a Paso \- ZigZag)**

* Alternar texto e imagen (o icono grande) para explicar el flujo:  
  1. **Planificación (Web):** Calendario de mantenimientos y asignación de técnicos.  
  2. **Ejecución (App Móvil):** El técnico recibe la OT, usa insumos y cierra la tarea en su celular/tablet.  
  3. **Análisis (Dashboard):** Verificación gráfica de cumplimiento y costos.

### **E. Tech & Bodega (App Warehouse)**

* Sección dedicada a la logística.  
* Destacar el uso de **Smartphone/Tablet** para actividades de bodega (entrada/salida de insumos).  
* Iconografía relacionada con códigos QR, cajas y checklists.

### **F. Footer Simple**

* Enlaces rápidos, contacto de soporte y copyright.  
* Fondo color \#F8FAFC o \#E8F0FE.

## **4\. Requisitos de Código (React · Monorepo · Serve)**

1. **Configuración Tailwind:** Incluir la configuración de colores provistos en el `tailwind.config.js` del `frontend` (primary: '#89C2D9', text-main: '#4A5568', etc.). Si se usa el prototipo en HTML estático, también proveer un ejemplo vía CDN para la demo.
2. **React Integration:** Usar React con Vite (recomendado) o Create React App. Emplear `react-router` para el enrutado SPA y configurar el servidor para devolver `index.html` como fallback.
3. **Build & Output:** El `frontend` debe exponer un script `build` (por ejemplo `npm run build`) que genere los activos estáticos en `packages/frontend/dist` (o `build/` si CRA).
4. **Backend Serve al iniciar:** El `backend` debe estar implementado con **Express** y configurado para servir estático desde `packages/frontend/dist` (o `build`) al arrancar. Requisitos mínimos del backend:
  - Servir archivos estáticos desde la carpeta `dist`/`build` usando `express.static`.
  - Para cualquier ruta no encontrada, devolver `dist/index.html` o `build/index.html` (SPA fallback).
  - Tener un script `start` que arranca el servidor y automáticamente use el `dist` (si `dist` no existe, documentar que primero hay que ejecutar `npm run build` en el frontend).
5. **Contraste:** Asegurar accesibilidad; si el contraste entre blanco y `#89C2D9` no cumple, usar gris oscuro en texto de botones.
6. **Responsive:** El Hero debe apilarse en móvil (dispositivo encima/abajo del texto). En escritorio mostrar composición de laptop/tablet/smartphone.
7. **Copywriting:** Mantener terminología industrial: "Mantenimiento Preventivo", "Activos Críticos", "KPIs", "Trazabilidad".

Instrucciones de Dev/Integración (para el prompt):
- El proyecto debe poder instalarse y ejecutarse usando **únicamente `npm`**; usar `npm workspaces` en la raíz del monorepo para orquestar instalaciones y scripts.
- En el prompt que generes para el equipo, incluye una sección "Cómo ejecutar localmente" con comandos basados en `npm`:

  - Instalar dependencias en la raíz del monorepo:

    ```bash
    npm install
    ```

  - Comandos de desarrollo (ejemplo con scripts de workspace definidos en la raíz):

    ```bash
    npm run dev:frontend   # ejecuta el frontend en modo dev (e.g. vite)
    npm run dev:backend    # ejecuta el backend (Express) en modo dev
    ```

  - Para generar la versión de producción del frontend y arrancar el backend que la sirva:

    ```bash
    npm run build:frontend
    npm run start:backend
    ```

  - Ejemplo de scripts que deberían definirse en la raíz `package.json` (promptar al equipo a incluirlos):

    ```json
    {
      "scripts": {
        "dev:frontend": "npm --workspace packages/frontend run dev",
        "dev:backend": "npm --workspace packages/backend run dev",
        "build:frontend": "npm --workspace packages/frontend run build",
        "start:backend": "npm --workspace packages/backend run start"
      }
    }
    ```

- Añadir una nota: para despliegues, el `backend` debe usar Express para servir la carpeta `dist`/`build` del `frontend` (por ejemplo `express.static(path.join(__dirname, '..', 'frontend', 'dist'))`) y devolver `index.html` como fallback para rutas SPA.