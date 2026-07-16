import { Capacitor } from '@capacitor/core';

// URL dinamica: en plataforma nativa (APK) siempre usa produccion,
// en browser usa la variable de entorno o localhost
const PRODUCTION_API = 'https://backend-production-a6ce.up.railway.app/api';
export const API_URL = Capacitor.isNativePlatform()
  ? PRODUCTION_API
  : (import.meta.env.VITE_API_URL || 'http://localhost:4002/api');
export const BACKEND_URL = API_URL.replace(/\/api$/, '');

// Resuelve URL de archivo: convierte URLs de S3 Wasabi al proxy del backend,
// y agrega BACKEND_URL a URLs relativas
export const resolveFileUrl = (url) => {
  if (!url) return '';
  // Convertir URLs directas de S3 Wasabi al proxy del backend
  const s3Match = url.match(/^https?:\/\/s3[^/]*\.wasabisys\.com\/[^/]+\/(.+)$/);
  if (s3Match) return `${BACKEND_URL}/api/catalog/files/${s3Match[1]}`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_URL}${url}`;
};

export const ROLES = {
  COMPRADOR: 'COMPRADOR',
  VENDEDOR: 'VENDEDOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
};

export const APPROVAL_STATUS = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
};

export const TICKET_STATUS = {
  PENDIENTE: 'PENDIENTE',
  RESPONDIDO: 'RESPONDIDO',
  EN_ESPERA_DE_RESPUESTA: 'EN_ESPERA_DE_RESPUESTA',
  ATENDIDO: 'ATENDIDO',
};

export const PLAN_TYPE = {
  ESTANDAR: 'ESTANDAR',
  PREMIUM: 'PREMIUM',
};

export const TICKET_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  RESPONDIDO: 'Respondido',
  EN_ESPERA_DE_RESPUESTA: 'En espera',
  ATENDIDO: 'Atendido',
};

export const APPROVAL_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

// Estado de cuenta derivado por el backend (deben coincidir con
// backend/config/constants.js ACCOUNT_STATUS). Llega ya calculado en
// `estado_cuenta`: no se recalcula aqui a partir de activo/correo_verificado.
export const ACCOUNT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  SUSPENDIDO: 'SUSPENDIDO',
};

export const ACCOUNT_STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIVO]: 'Activo',
  [ACCOUNT_STATUS.INACTIVO]: 'Inactivo',
  [ACCOUNT_STATUS.SUSPENDIDO]: 'Suspendido',
};

// Clases del badge de cada estado.
export const ACCOUNT_STATUS_BADGE_CLASS = {
  [ACCOUNT_STATUS.ACTIVO]: 'bg-seller-50 text-seller-600',
  [ACCOUNT_STATUS.INACTIVO]: 'bg-amber-50 text-amber-600',
  [ACCOUNT_STATUS.SUSPENDIDO]: 'bg-gray-100 text-gray-500',
};

// Chips y tarjetas de conteo por estado. `countKey` referencia los contadores
// de getBuyers/getSellers (backend/config/constants.js ACCOUNT_STATUS_COUNT_KEYS).
// `iconBg` pinta el circulo del icono; `accent`, el icono y el numero.
export const ACCOUNT_STATUS_FILTERS = [
  {
    key: 'active',
    label: 'Activos',
    status: ACCOUNT_STATUS.ACTIVO,
    countKey: 'activos',
    iconBg: 'bg-seller-100',
    accent: 'text-seller-500',
  },
  {
    key: 'unverified',
    label: 'Sin verificar',
    status: ACCOUNT_STATUS.INACTIVO,
    countKey: 'sin_verificar',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-500',
  },
  {
    key: 'suspended',
    label: 'Suspendidos',
    status: ACCOUNT_STATUS.SUSPENDIDO,
    countKey: 'suspendidos',
    iconBg: 'bg-red-100',
    accent: 'text-red-500',
  },
];

export const ROLE_ROUTES = {
  COMPRADOR: '/comprador/dashboard',
  VENDEDOR: '/vendedor/dashboard',
  ADMINISTRADOR: '/admin/dashboard',
};

// Codigos de error de autenticacion (deben coincidir con backend/config/constants.js AUTH_ERROR_CODES)
export const AUTH_ERROR_CODES = {
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
};

// Eventos SSE (deben coincidir con backend/config/eventNames.js)
export const SSE_EVENTS = {
  ACCOUNT_DISABLED: 'account.disabled',
  FAVORITES_UPDATED: 'favorites.updated',
  SHOPPING_LIST_UPDATED: 'shopping_list.updated',
};
