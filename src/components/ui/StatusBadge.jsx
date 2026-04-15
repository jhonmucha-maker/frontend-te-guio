const statusStyles = {
  PENDIENTE: 'badge-pending rounded-full font-bold',
  APROBADO: 'badge-approved rounded-full font-bold',
  RECHAZADO: 'badge-rejected rounded-full font-bold',
  ACTIVO: 'bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full',
  INACTIVO: 'bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-0.5 rounded-full',
  RESPONDIDO: 'bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full',
  EN_ESPERA_DE_RESPUESTA: 'bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full',
  ATENDIDO: 'bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full',
  PREMIUM: 'badge-premium rounded-full font-bold',
  ESTANDAR: 'badge-estandar rounded-full font-bold',
};

const statusLabels = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  RESPONDIDO: 'Respondido',
  EN_ESPERA_DE_RESPUESTA: 'En espera',
  ATENDIDO: 'Atendido',
  PREMIUM: 'Premium',
  ESTANDAR: 'Estándar',
};

export default function StatusBadge({ status, label }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-0.5 rounded-full';
  const text = label || statusLabels[status] || status;

  return <span className={style}>{text}</span>;
}
