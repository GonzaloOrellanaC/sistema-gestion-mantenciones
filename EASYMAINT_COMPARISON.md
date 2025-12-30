# Comparación: EasyMaint vs esta aplicación (Easymaint software)

Resumen: este documento compara las funcionalidades descritas de EasyMaint (CMMS/EAM) con lo que actualmente ofrece esta aplicación (repositorio). Indica qué se implementó, qué falta y qué elementos adicionales tiene esta app.

**EasyMaint — funcionalidades clave (resumen)**:
- **Gestión de Activos y Equipos**: jerarquía de activos, ficha técnica, localización.
- **Mantenimiento Preventivo y Predictivo**: programación por calendario/uso, integración de condiciones (sensores), calendario maestro.
- **Órdenes de Trabajo (OT)**: ciclo completo (creación, asignación, ejecución, cierre), solicitudes de servicio, control de costos por OT.
- **Control de Inventarios y Almacenes**: catálogo de repuestos, niveles mínimos/máximos, multialmacén, reserva de piezas.
- **Compras y Proveedores**: requisiciones automáticas, gestión de proveedores, recepción y factura.
- **Análisis, reportes y KPIs**: MTBF/MTTR, dashboards, informes personalizados.

**Funcionalidades implementadas en esta aplicación (estado actual)**:
- **Autenticación**: registro, login, recuperación y restablecimiento de contraseña (JWT + bcrypt).
- **Multitenancy básica / Organización**: creación de organización al registrar; seed de superadmin global.
- **Roles & Permissions**: modelo `Role` con `permissions` y CRUD básico en backend.
- **Pautas (Templates)**: modelo + CRUD + preview; estructura `structure` JSON guardada para plantillas.
- **Órdenes de Trabajo**: modelo de OT, flujo básico (creado → asignado → iniciado → revisión → terminado), y contador `orgSeq` por organización (colección `counters` con operación atómica `findOneAndUpdate`).
- **Archivos/Adjuntos**: upload de archivos (límite 5 MB) y metadatos; utilitarios para manejo de archivos en backend.
- **Realtime**: integración con `Socket.io` (rooms por `orgId` y `user:<userId>`).
- **Frontend (Ionic React)**: `AuthContext`, `axios` configurado (`VITE_API_BASE_URL`), páginas básicas (Login/Register/Dashboard/Templates list/preview), `MainLayout` con `IonMenu`.
- **App móvil (Ionic/Capacitor)**: integración con Capacitor, capacidad de usar cámara/geolocalización y flujo móvil básico para OT (ver `app` folder `.env` y builds/capacitor scripts en repo).
- **Tooling / docs**: colección Postman (`postman/sistema-gestion.postman_collection.json`), `PLAN.md` y `STATUS.md` actualizados.

**Elementos adicionales que esta app tiene (respecto a la descripción de EasyMaint)**:
- **Constructor de plantillas (pautas)** y preview responsive específico para formularios/inspecciones (EasyMaint es asset-first, no form-builder centrado).
- **Mobile-first workflow** (Ionic + Capacitor) y utilidades ya integradas para cámara y subida de fotos desde la app; despliegue y build scripts para Android están presentes en el repo.
- **Contador `orgSeq` atómico** por organización (evita colisiones en numeración de OTs, detalle técnico útil).
- **Colección Postman y envs preparados** (`.env.*`) con ejemplos para desarrollo/producción y automatización de builds en `app` y `frontend`.

**Elementos que faltan en esta app respecto a EasyMaint (brechas importantes)**:
- **Gestión de Activos/EAM completa**: falta una gestión robusta de activos con jerarquía (planta/área/sistema/subsistema), ficha técnica de cada activo (serial, specs, historial de mantenimiento por activo) y rastreo de localización física.
- **Mantenimiento Predictivo y lecturas de medidores**: no hay integración con señales/lecturas para programación basada en uso (horas/km) ni integración con sensores/IoT para alertas predictivas.
- **Control de Inventarios y multialmacén**: catálogo de repuestos, control de stock, apartados automáticos y reorden no implementados.
- **Compras / Proveedores / Recepción**: flujos de requisiciones, órdenes de compra, gestión y evaluación de proveedores y recepción vinculada a facturas no presentes.
- **Control y contabilización de costos en OT**: desglose de mano de obra, materiales y servicios externos por OT (presupuestos y control de costos) está ausente o limitado.
- **Análisis avanzados, KPIs y dashboards**: no hay dashboards avanzados ni cálculo automatizado de MTBF/MTTR ni reportes personalizables al nivel de EasyMaint.
- **Calendar Maestro avanzado**: vista global de balance de carga y programa predictivo no completo.
- **Inventario multialmacén y reaprovisionamiento automático**: ausente.
- **Integraciones externas ERP / FCM/APNs**: notificaciones push nativas (FCM/APNs) y enlaces a ERPs/contabilidad no integrados aún.

**Recomendaciones de prioridad para acercarse a EasyMaint**:
1. Implementar módulo de `Assets` con jerarquía y ficha técnica ligada a historial de OTs.
2. Añadir Inventario/Almacenes (multialmacén) y vínculo entre OT → reserva/consumo de piezas.
3. Añadir control de costos por OT (mano de obra, partes, terceros) y vincular a reportes financieros.
4. Implementar calendario maestro y reglas de programación preventiva/predictiva (soporte para lecturas y triggers por condición).
5. Construir paneles de KPI (MTBF/MTTR) y reportes exportables; priorizar métricas críticas para mantenimiento.

---
Fecha: 2025-12-30

Archivo generado automáticamente a partir del estado del repositorio (`PLAN.md`, `STATUS.md`, código y envs). Si quieres, puedo:
- generar una matriz de prioridades (tareas y estimadas en días) para cerrar las brechas con EasyMaint, o
- comenzar implementando el módulo `Assets` (modelo + endpoints + UI básica).

---

## Plan de ejecución recomendado (priorizado)

Objetivo: cerrar las brechas críticas respecto a EasyMaint de forma incremental, minimizando impacto en producción y priorizando valor para usuarios.

### Fase 1 — Módulo `Assets` (prioridad alta)
- Backend: crear modelos `Asset`, `AssetType`, `AssetHierarchy`, endpoints CRUD, historial de mantenimiento por activo y relación `assetId` en `work_orders`.
- Frontend: listas de activos, vista detalle (ficha técnica), selector de activo al crear OT.
- Impacto positivo: permite asociar OT a activos, trazabilidad y base para reportes por equipo.
- Riesgos / impacto negativo: migraciones de DB y aumento en la complejidad de creación de OT; requiere cambios en validaciones y tests.

### Fase 2 — Inventario & Almacenes (prioridad alta)
- Backend: modelos `Part`, `Stock`, `Warehouse`, movimientos (`StockMovement`), reservas automáticas al crear OT.
- Frontend: catálogo de piezas, reserva/consumo en la vista de OT y admin de almacenes.
- Impacto positivo: reduce paradas por falta de repuestos; posibilita reorden automático.
- Riesgos: requiere transacciones/consistencia en DB; potencial impacto en performance en operaciones concurrentes.

### Fase 3 — Control de costos por OT (prioridad media)
- Backend: `CostItem` por OT (mano de obra, partes, terceros), endpoints de agregación y facturación básica.
- Frontend: formulario para imputar costos en la OT y sección de resumen financiero por OT/org.
- Impacto positivo: facilita decisiones de reemplazo y cálculo ROI de mantenimientos.
- Riesgos: cambios en modelos y cálculos que pueden afectar reportes previos; requiere controles en permisos (quién puede modificar costos).

### Fase 4 — Calendar maestro y mantenimiento preventivo/predictivo (prioridad media)
- Backend: scheduler (cron/agenda), reglas basadas en tiempo y en uso (hooks para lecturas de medidores), endpoints para generar OT programadas.
- Frontend: vista calendario (FullCalendar) con capacidad de reasignar y balancear carga.
- Impacto positivo: reduce fallas no programadas y mejora planificación.
- Riesgos: complejidad operativa (jobs, retries), integración con lecturas/sensores puede necesitar infra adicional.

### Fase 5 — KPIs, dashboards y reportes (prioridad media-baja)
- Backend: endpoints para métricas (MTBF, MTTR, downtime), agregaciones por periodo/org/activo.
- Frontend: dashboards gráficos, filtros y export CSV/PDF.
- Impacto positivo: soporte a toma de decisiones y auditorías.
- Riesgos: carga en BD por agregaciones; considerar materialized/summary tables o jobs nocturnos.

### Fase 6 — Integraciones y notificaciones nativas (prioridad baja)
- Backend: integración FCM/APNs para push nativas, webhooks/ERP connectors, API keys y seguridad.
- Frontend/App: soporte nativo para notificaciones push y manejo de deep-links.
- Impacto positivo: mejor engagement móvil y posibilidad de integrarse con sistemas contables/ERP.
- Riesgos: configuración por plataforma, gestión de secretos y pruebas E2E más complejas.

### Consideraciones transversales
- Migraciones y datos: diseñar scripts de migración y backfill (p.ej. asignar assets a OTs históricas opcionalmente) y probar en staging.
- Pruebas: crear suites unitarias e2e para flows críticos (crear OT, asignar, reservar stock, cerrar OT, reportes).
- Performance: indexar consultas frecuentes (orgId, assetId, state, createdAt) y delegar agregaciones pesadas a jobs.
- Seguridad y roles: extender `Role` y permisos para controlar quién puede crear/editar assets, movimientos de stock y costos.

### Estimación rápida (orientativa)
- Fase 1: 5-10 días (backend + API + UI básica)
- Fase 2: 7-14 días
- Fase 3: 4-8 días
- Fase 4: 7-14 días
- Fase 5: 5-10 días
- Fase 6: 5-12 días

Siguiente paso que puedo ejecutar ahora:
- Generar la matriz de tareas con subtareas y estimaciones por archivo/servicio (backend/frontend) y abrir el primer branch `feature/assets`.

---

Fecha: 2025-12-30

Archivo generado automáticamente a partir del estado del repositorio (`PLAN.md`, `STATUS.md`, código y envs).