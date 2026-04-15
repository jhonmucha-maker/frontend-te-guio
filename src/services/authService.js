import apiClient from './apiClient';

export const authService = {
  login: (correo, contrasena, deviceToken = null) =>
    apiClient.post('/auth/login', {
      correo,
      contrasena,
      ...(deviceToken ? { device_token: deviceToken, plataforma: 'ANDROID' } : {}),
    }),

  registerBuyer: (data) =>
    apiClient.post('/auth/register/buyer', data),

  registerSeller: (data) =>
    apiClient.post('/auth/register/seller', data),

  verifyEmail: (correo, codigo) =>
    apiClient.post('/auth/verify-email', { correo, codigo }),

  resendCode: (correo) =>
    apiClient.post('/auth/resend-email-code', { correo }),

  forgotPassword: (correo) =>
    apiClient.post('/auth/password/forgot', { correo }),

  resetPassword: (token, nueva_contrasena) =>
    apiClient.post('/auth/password/reset', { token, nueva_contrasena }),

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (deviceToken = null) =>
    apiClient.post('/auth/logout', deviceToken ? { device_token: deviceToken } : {}),

  getMe: () =>
    apiClient.get('/auth/me'),

  getTerms: () =>
    apiClient.get('/auth/terms'),

  acceptTerms: (id_version) =>
    apiClient.post('/auth/accept-terms', { id_version }),
};
