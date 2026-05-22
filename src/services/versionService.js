import axios from 'axios';
import { API_URL } from '../utils/constants';

// Cliente axios INDEPENDIENTE (sin interceptores de auth/refresh).
// Razones:
//  - El endpoint /api/version es publico (no requiere Bearer token).
//  - Evita que el interceptor de refresh-token de apiClient.js se dispare en
//    arranque (cuando aun no hay sesion) y cause loops o errores extranos.
//  - Timeout de 5s para fail-fast: si el backend esta caido o lento, el
//    VersionGuard pasa a fail-open rapidamente y no bloquea el arranque.
const versionClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

export const versionService = {
  getAppVersion: () => versionClient.get('/version'),
};
