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
