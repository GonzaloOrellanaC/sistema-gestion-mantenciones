export const translations = {
  es: {
    nav: {
      home: 'Inicio',
      features: 'Funcionalidades',
      useCases: 'Casos de Uso',
      mobile: 'Móvil',
      dashboard: 'Dashboard',
      contact: 'Contacto',
      clientAccess: 'Acceso Clientes',
    },
    hero: {
      badge: 'Gestión de Mantenciones 4.0',
      title: 'Optimiza tus',
      titleHighlight: 'Operaciones',
      titleEnd: 'y Controla tus Activos',
      description: 'SGM es la plataforma integral para empresas de mantenimiento. Digitaliza órdenes de trabajo, gestiona inventario en tiempo real y elimina el papel con nuestra interfaz web optimizada para móviles.',
      ctaDemo: 'Solicitar Demo',
      ctaFeatures: 'Ver Características',
      check1: 'Sin instalación (Cloud)',
      check2: '100% Web & Móvil',
      check3: 'Soporte 24/7',
    },
    features: {
      sectionTitle: 'Características Principales',
      mainTitle: 'Todo lo que necesitas para tu operación',
      description: 'SGM centraliza toda la información operativa, permitiendo una transición fluida desde el papel hacia la eficiencia digital.',
      items: [
        { title: "Órdenes de Trabajo Dinámicas", description: "Crea y asigna órdenes con flujos personalizados. Monitorea estados: asignación, ejecución, y término real." },
        { title: "Gestión en Terreno", description: "Técnicos ejecutan pautas desde cualquier smartphone o tablet. Carga de datos, fotos y firmas digitales al instante." },
        { title: "Control de Bodega y Stock", description: "Gestión de insumos y repuestos por lotes. Escaneo de QR/Códigos de barra para salidas de bodega." },
        { title: "Gestión de Activos", description: "Historial de vida completo de cada equipo o instalación. Planes de mantenimiento preventivo." },
        { title: "Dashboard Inteligente", description: "Visualiza KPIs en tiempo real: órdenes retrasadas, costos por activo y eficiencia del equipo." },
        { title: "Gestión de Usuarios", description: "Roles granulares para administradores, bodegueros y técnicos de terreno. Seguridad total." }
      ]
    },
    useCases: {
      sectionTitle: 'Entornos Reales',
      mainTitle: 'SGM donde ocurre la acción',
      description: 'Nuestra plataforma se adapta a la realidad de tu operación, empoderando a cada miembro de tu equipo con herramientas móviles intuitivas.',
      items: [
        { title: "Control en Bodega", description: "Optimiza la entrada y salida de insumos. El personal de bodega utiliza tablets para escanear códigos QR y rebajar stock en tiempo real.", context: "Bodega y Pañol" },
        { title: "Técnicos en Terreno", description: "Tus técnicos reciben sus órdenes de trabajo en el smartphone. Registran horas hombre, checklists y cierran la OT con firma digital del cliente.", context: "Terreno / Obra" },
        { title: "Supervisión en Taller", description: "Los jefes de taller monitorean el avance de las reparaciones a pie de máquina, asignando recursos y aprobando presupuestos al instante.", context: "Taller Mecánico" }
      ]
    },
    mobile: {
      badge: 'PLATAFORMA WEB MÓVIL',
      title: 'Potencia a tu equipo en terreno',
      description: 'Nuestra interfaz web optimizada conecta a tus técnicos directamente con la administración central. Accesible desde cualquier dispositivo con navegador.',
      scanTitle: 'Escáner QR en Web',
      scanDesc: 'Usa la cámara del dispositivo para identificar activos directamente desde el navegador.',
      photoTitle: 'Evidencia Fotográfica',
      photoDesc: 'Adjunta fotos del antes y después directamente en la OT.',
      noInstallTitle: 'Sin Instalaciones',
      noInstallDesc: 'Olvídate de las actualizaciones y tiendas de aplicaciones. Ingresa y trabaja.',
      mockup: {
        greeting: 'Hola, Técnico',
        pending: 'Órdenes Pendientes',
        ot1: 'Mantención Aire Acondicionado',
        ot1Loc: 'Sucursal Norte',
        ot2: 'Reparación Tablero Eléctrico',
        ot2Loc: 'Bodega Central'
      }
    },
    dashboard: {
      chartTitle: 'Evolución de Órdenes de Trabajo',
      typesTitle: 'Tipos de Ordenes de Trabajo',
      efficiencyTitle: 'Eficiencia General',
      vsMonth: '+5.4% vs mes anterior',
      mainTitle: 'Toma decisiones basadas en',
      mainTitleHighlight: 'datos reales',
      description: 'Olvídate de las planillas de cálculo manuales. SGM genera reportes automáticos sobre el rendimiento de tu equipo.',
      list: [
        "Proyecciones de costos de insumos.",
        "Alertas de stock crítico en bodega.",
        "Seguimiento de tiempos de respuesta por técnico.",
        "Reportes de trazabilidad para clientes."
      ],
      chart: {
        proyectadas: 'Proyectadas',
        completadas: 'Completadas',
        retrasadas: 'Retrasadas',
        months: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
        types: ['Mecánica', 'Eléctrica', 'Instalaciones', 'Preventiva']
      }
    },
    contact: {
      title: '¿Listo para modernizar tu gestión?',
      description: 'Agenda una demostración personalizada y descubre cómo SGM puede reducir tus costos operativos hasta un 30%.',
      metaBase: 'Plataforma cloud para gestión de mantenciones: órdenes de trabajo, control de stock, gestión de activos y dashboard en tiempo real. Solicita demo escribiendo a',
      email: 'sgm@omtecnologia.cl',
      emailHref: 'mailto:sgm@omtecnologia.cl',
      step1: 'Análisis de tus necesidades actuales',
      step2: 'Demo guiada de la plataforma web y app',
      step3: 'Propuesta de implementación a medida',
      nameLabel: 'Nombre Completo',
      namePlaceholder: 'Tu nombre',
      emailLabel: 'Correo Electrónico',
      emailPlaceholder: 'tu@empresa.com',
      companyLabel: 'Empresa',
      companyPlaceholder: 'Nombre de tu empresa',
      cta: 'Solicitar Contacto'
      ,
      note: 'También puedes incluir nombre y empresa en el correo.'
    },
    footer: {
      description: 'Sistema integral para la gestión de mantenciones, activos y bodegas. Desarrollado por OM Tecnología.',
      colPlatform: 'Plataforma',
      colCompany: 'Empresa',
      colContact: 'Contacto',
      links: {
        features: 'Funcionalidades',
        mobile: 'Acceso Móvil',
        integrations: 'Integraciones',
        pricing: 'Precios',
        about: 'Sobre Nosotros',
        cases: 'Casos de Éxito',
        blog: 'Blog',
        support: 'Soporte',
        privacy: 'Privacidad',
        terms: 'Términos'
      },
      rights: 'OM Tecnología. Todos los derechos reservados.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      useCases: 'Use Cases',
      mobile: 'Mobile',
      dashboard: 'Dashboard',
      contact: 'Contact',
      clientAccess: 'Client Access',
    },
    hero: {
      badge: 'Maintenance Management 4.0',
      title: 'Optimize your',
      titleHighlight: 'Operations',
      titleEnd: 'and Control your Assets',
      description: 'SGM is the comprehensive platform for maintenance companies. Digitize work orders, manage inventory in real-time, and eliminate paper with our mobile-optimized web interface.',
      ctaDemo: 'Request Demo',
      ctaFeatures: 'View Features',
      check1: 'No installation (Cloud)',
      check2: '100% Web & Mobile',
      check3: '24/7 Support',
    },
    features: {
      sectionTitle: 'Main Features',
      mainTitle: 'Everything you need for your operation',
      description: 'SGM centralizes all operational information, allowing a seamless transition from paper to digital efficiency.',
      items: [
        { title: "Dynamic Work Orders", description: "Create and assign orders with custom workflows. Monitor statuses: assignment, execution, and actual completion." },
        { title: "Field Management", description: "Technicians execute checklists from any smartphone or tablet. Upload data, photos, and digital signatures instantly." },
        { title: "Warehouse & Stock Control", description: "Manage supplies and spare parts by batches. QR/Barcode scanning for warehouse checkouts." },
        { title: "Asset Management", description: "Complete lifecycle history of each equipment or facility. Preventive maintenance plans." },
        { title: "Smart Dashboard", description: "Visualize KPIs in real-time: delayed orders, costs per asset, and team efficiency." },
        { title: "User Management", description: "Granular roles for administrators, warehouse staff, and field technicians. Total security." }
      ]
    },
    useCases: {
      sectionTitle: 'Real Environments',
      mainTitle: 'SGM where the action happens',
      description: 'Our platform adapts to the reality of your operation, empowering every team member with intuitive mobile tools.',
      items: [
        { title: "Warehouse Control", description: "Optimize supply entry and exit. Warehouse staff use tablets to scan QR codes and update stock in real-time.", context: "Warehouse" },
        { title: "Field Technicians", description: "Your technicians receive work orders on their smartphones. They log man-hours, checklists, and close WOs with client digital signatures.", context: "Field / Site" },
        { title: "Workshop Supervision", description: "Workshop managers monitor repair progress on the shop floor, assigning resources and approving budgets instantly.", context: "Mechanic Workshop" }
      ]
    },
    mobile: {
      badge: 'MOBILE WEB PLATFORM',
      title: 'Empower your team in the field',
      description: 'Our optimized web interface connects your technicians directly with central administration. Accessible from any device with a browser.',
      scanTitle: 'Web QR Scanner',
      scanDesc: 'Use the device camera to identify assets directly from the browser.',
      photoTitle: 'Photo Evidence',
      photoDesc: 'Attach before and after photos directly to the WO.',
      noInstallTitle: 'No Installation',
      noInstallDesc: 'Forget updates and app stores. Log in and work.',
      mockup: {
        greeting: 'Hello, Tech',
        pending: 'Pending Orders',
        ot1: 'AC Maintenance',
        ot1Loc: 'North Branch',
        ot2: 'Electric Board Repair',
        ot2Loc: 'Central Warehouse'
      }
    },
    dashboard: {
      chartTitle: 'Work Order Evolution',
      typesTitle: 'Maintenance Types',
      efficiencyTitle: 'Overall Efficiency',
      vsMonth: '+5.4% vs last month',
      mainTitle: 'Make decisions based on',
      mainTitleHighlight: 'real data',
      description: 'Forget manual spreadsheets. SGM generates automatic reports on your team\'s performance.',
      list: [
        "Supply cost projections.",
        "Critical stock alerts in warehouse.",
        "Response time tracking per technician.",
        "Traceability reports for clients."
      ],
      chart: {
        proyectadas: 'Projected',
        completadas: 'Completed',
        retrasadas: 'Delayed',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        types: ['Mechanical', 'Electrical', 'Facilities', 'Preventive']
      }
    },
    contact: {
      title: 'Ready to modernize your management?',
      description: 'Schedule a personalized demo and discover how SGM can reduce your operating costs by up to 30%.',
      metaBase: 'Cloud platform for maintenance management: work orders, stock control, asset management and real-time dashboards. Request a demo by writing to',
      email: 'sgm@omtecnologia.cl',
      emailHref: 'mailto:sgm@omtecnologia.cl',
      step1: 'Analysis of your current needs',
      step2: 'Guided demo of web platform and app',
      step3: 'Custom implementation proposal',
      nameLabel: 'Full Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@company.com',
      companyLabel: 'Company',
      companyPlaceholder: 'Company Name',
      cta: 'Request Contact'
      ,
      note: 'You can also include your name and company in the email.'
    },
    footer: {
      description: 'Comprehensive system for maintenance, asset, and warehouse management. Developed by OM Tecnología.',
      colPlatform: 'Platform',
      colCompany: 'Company',
      colContact: 'Contact',
      links: {
        features: 'Features',
        mobile: 'Mobile Access',
        integrations: 'Integrations',
        pricing: 'Pricing',
        about: 'About Us',
        cases: 'Success Stories',
        blog: 'Blog',
        support: 'Support',
        privacy: 'Privacy',
        terms: 'Terms'
      },
      rights: 'OM Tecnología. All rights reserved.'
    }
  }
};