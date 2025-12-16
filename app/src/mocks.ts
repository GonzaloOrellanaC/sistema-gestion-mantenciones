export const MOCK_USER = {
  name: 'Carlos Ruiz',
  role: 'Técnico de Campo',
  avatar: 'CR',
  stats: { pending: 3, done: 12 },
};

export const MOCK_ORDERS = [
  {
    id: 'OT-2023',
    client: 'Constructora ABC',
    address: 'Av. Libertador 1234, Torre A',
    status: 'pending',
    date: '2023-11-24',
    type: 'Inspección Eléctrica',
  },
  {
    id: 'OT-2024',
    client: 'Retail Norte S.A.',
    address: 'Mall Plaza, Local 405',
    status: 'in_progress',
    date: '2023-11-25',
    type: 'Mantenimiento HVAC',
  },
  {
    id: 'OT-2025',
    client: 'Hospital Central',
    address: 'Urgencias, Sala 4',
    status: 'done',
    date: '2023-11-20',
    type: 'Revisión Gases Clínicos',
  },
];

export const MOCK_PAUTA_SCHEMA = [
  { id: 'f1', type: 'text', label: 'Responsable en sitio', required: true, placeholder: 'Nombre del jefe de obra' },
  { id: 'f2', type: 'select', label: 'Estado Inicial', options: ['Operativo', 'Con Fallas', 'Fuera de Servicio'], required: true },
  { id: 'f3', type: 'geo', label: 'Coordenadas de Ingreso', required: false },
  { id: 'f4', type: 'photo', label: 'Evidencia del Tablero', required: true },
  { id: 'f5', type: 'textarea', label: 'Observaciones Técnicas', placeholder: 'Describa el hallazgo...', required: false },
  { id: 'f6', type: 'signature', label: 'Firma de Conformidad', required: true },
];

export default { MOCK_USER, MOCK_ORDERS, MOCK_PAUTA_SCHEMA };
