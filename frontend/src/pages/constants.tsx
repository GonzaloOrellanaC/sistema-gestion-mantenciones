import { Feature } from '../types';
import { 
  layersOutline, 
  documentTextOutline, 
  cloudOfflineOutline, 
  calendarOutline, 
  pulseOutline, 
  phonePortraitOutline 
} from 'ionicons/icons';

export const FEATURES: Feature[] = [
  {
    id: 'f1',
    title: 'Gestión Integral de Activos',
    description: 'Centraliza inspecciones, mantenciones y reparaciones. Controla repuestos, insumos y stocks en tiempo real.',
    icon: layersOutline,
  },
  {
    id: 'f2',
    title: 'Reportes Automáticos',
    description: 'Genera documentación PDF profesional al finalizar cada Orden de Trabajo, lista para enviar al cliente.',
    icon: documentTextOutline,
  },
  {
    id: 'f3',
    title: 'Modo Offline',
    description: 'Sigue operando en zonas sin cobertura. Los datos se sincronizan automáticamente cuando recuperas la conexión.',
    icon: cloudOfflineOutline,
  },
  {
    id: 'f4',
    title: 'Planificación Inteligente',
    description: 'Calendariza estados de OT y visualiza líneas de tiempo para estimar inicios y fines de ejecución.',
    icon: calendarOutline,
  },
  {
    id: 'f5',
    title: 'Control en Tiempo Real',
    description: 'Monitorea el avance de las órdenes de trabajo online y toma decisiones basadas en datos actualizados.',
    icon: pulseOutline,
  },
  {
    id: 'f6',
    title: 'Multi-Dispositivo',
    description: 'Panel de administración web robusto y aplicación móvil ágil para tablets y smartphones.',
    icon: phonePortraitOutline,
  },
];