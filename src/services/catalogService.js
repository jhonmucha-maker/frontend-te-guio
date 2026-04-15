import apiClient from './apiClient';

export const catalogService = {
  getCities: () => apiClient.get('/catalog/cities'),
  getZones: (id_ciudad) => apiClient.get(`/catalog/zones/${id_ciudad}`),
  getGalleries: (id_zona) => apiClient.get(`/catalog/galleries/${id_zona}`),
  getCategories: () => apiClient.get('/catalog/categories'),
  getPlans: () => apiClient.get('/catalog/plans'),
  getPaymentMethods: () => apiClient.get('/catalog/payment-methods'),
  getCurrentTerms: () => apiClient.get('/catalog/terms/current'),
  getCurrentPrivacy: () => apiClient.get('/catalog/privacy/current'),
};
