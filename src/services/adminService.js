import apiClient from './apiClient';

export const adminService = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),

  // Aprobaciones
  getPendingSellers: () => apiClient.get('/admin/approvals/sellers'),
  approveSeller: (id, data) =>
    apiClient.patch(`/admin/approvals/sellers/${id}`, data),

  getPendingStores: () => apiClient.get('/admin/approvals/stores'),
  approveStore: (id, data) =>
    apiClient.patch(`/admin/approvals/stores/${id}`, data),

  getPendingProducts: () => apiClient.get('/admin/approvals/products'),
  approveProduct: (id, data) =>
    apiClient.patch(`/admin/approvals/products/${id}`, data),

  getPendingSubscriptions: () =>
    apiClient.get('/admin/approvals/subscriptions'),
  approveSubscription: (id, data) =>
    apiClient.patch(`/admin/approvals/subscriptions/${id}`, data),
  updateSubscriptionEndDate: (id, data) =>
    apiClient.patch(`/admin/subscriptions/${id}/end-date`, data),

  // Eliminacion masiva de rechazados
  bulkDeleteRejectedSellers: (ids) =>
    apiClient.post('/admin/approvals/sellers/bulk-delete', { ids }),
  bulkDeleteRejectedStores: (ids) =>
    apiClient.post('/admin/approvals/stores/bulk-delete', { ids }),
  bulkDeleteRejectedProducts: (ids) =>
    apiClient.post('/admin/approvals/products/bulk-delete', { ids }),
  bulkDeleteRejectedSubscriptions: (ids) =>
    apiClient.post('/admin/approvals/subscriptions/bulk-delete', { ids }),

  // Finanzas
  getFinanceSummary: () => apiClient.get('/admin/finance/summary'),
  getTransactions: (params) =>
    apiClient.get('/admin/finance/transactions', { params }),

  // Usuarios
  getBuyers: (params) => apiClient.get('/admin/users/buyers', { params }),
  getSellers: (params) => apiClient.get('/admin/users/sellers', { params }),
  toggleUserActive: (id) =>
    apiClient.patch(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // CRUD config
  getCities: () => apiClient.get('/admin/config/cities'),
  createCity: (data) => apiClient.post('/admin/config/cities', data),
  updateCity: (id, data) => apiClient.put(`/admin/config/cities/${id}`, data),
  deleteCity: (id) => apiClient.delete(`/admin/config/cities/${id}`),

  getZones: () => apiClient.get('/admin/config/zones'),
  createZone: (data) => apiClient.post('/admin/config/zones', data),
  updateZone: (id, data) => apiClient.put(`/admin/config/zones/${id}`, data),
  deleteZone: (id) => apiClient.delete(`/admin/config/zones/${id}`),

  getCategories: () => apiClient.get('/admin/config/categories'),
  createCategory: (data) => apiClient.post('/admin/config/categories', data),
  updateCategory: (id, data) =>
    apiClient.put(`/admin/config/categories/${id}`, data),
  deleteCategory: (id) =>
    apiClient.delete(`/admin/config/categories/${id}`),

  getGalleries: () => apiClient.get('/admin/config/galleries'),
  createGallery: (data) => apiClient.post('/admin/config/galleries', data),
  updateGallery: (id, data) =>
    apiClient.put(`/admin/config/galleries/${id}`, data),
  deleteGallery: (id) => apiClient.delete(`/admin/config/galleries/${id}`),

  getFaqs: () => apiClient.get('/admin/config/faqs'),
  createFaq: (data) => apiClient.post('/admin/config/faqs', data),
  updateFaq: (id, data) => apiClient.put(`/admin/config/faqs/${id}`, data),
  deleteFaq: (id) => apiClient.delete(`/admin/config/faqs/${id}`),

  getPaymentMethods: () => apiClient.get('/admin/config/payment-methods'),
  createPaymentMethod: (data) =>
    apiClient.post('/admin/config/payment-methods', data),
  updatePaymentMethod: (id, data) =>
    apiClient.put(`/admin/config/payment-methods/${id}`, data),
  deletePaymentMethod: (id) =>
    apiClient.delete(`/admin/config/payment-methods/${id}`),

  // Planes de suscripcion (solo lectura + edicion precio/duracion)
  getPlans: () => apiClient.get('/admin/config/plans'),
  updatePlan: (id, data) =>
    apiClient.patch(`/admin/config/plans/${id}`, data),

  // Plan Features
  getPlanFeatures: (planId) => apiClient.get(`/admin/config/plans/${planId}/features`),
  createPlanFeature: (planId, data) => apiClient.post(`/admin/config/plans/${planId}/features`, data),
  updatePlanFeature: (planId, featureId, data) => apiClient.patch(`/admin/config/plans/${planId}/features/${featureId}`, data),
  deletePlanFeature: (planId, featureId) => apiClient.delete(`/admin/config/plans/${planId}/features/${featureId}`),
  reorderPlanFeatures: (planId, ids) => apiClient.post(`/admin/config/plans/${planId}/features/reorder`, { ids }),

  // Configuracion del sistema (solo lectura + edicion valor)
  getSystemConfig: () => apiClient.get('/admin/config/system'),
  updateSystemConfig: (id, data) =>
    apiClient.patch(`/admin/config/system/${id}`, data),

  // Tickets admin
  getAllTickets: (params) => apiClient.get('/tickets', { params }),

  // Reports
  getReports: (params) => apiClient.get('/admin/reports', { params }),
  getInactiveUsers: (params) => apiClient.get('/admin/reports/inactive-users', { params }),

  // Admins management
  getAdmins: () => apiClient.get('/admin/admins'),
  createAdmin: (data) => apiClient.post('/admin/admins', data),
  updateAdmin: (id, data) => apiClient.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => apiClient.delete(`/admin/admins/${id}`),

  // Seller cascade delete
  cascadeDeleteSeller: (id) => apiClient.delete(`/admin/users/sellers/${id}/cascade`),

  // Export
  exportSellersExcel: () => apiClient.get('/admin/export/sellers', { responseType: 'blob' }),

  // Gallery photos
  addGalleryPhotos: (id, formData) =>
    apiClient.post(`/admin/galleries/${id}/photos`, formData, { timeout: 60000 }),
  deleteGalleryPhoto: (galleryId, photoId) =>
    apiClient.delete(`/admin/galleries/${galleryId}/photos/${photoId}`),

  // Terms & conditions
  getTerms: () => apiClient.get('/admin/config/terms'),
  createTerms: (data) => apiClient.post('/admin/config/terms', data),
  updateTerms: (id, data) => apiClient.put(`/admin/config/terms/${id}`, data),
  deleteTerms: (id) => apiClient.delete(`/admin/config/terms/${id}`),

  // Privacy policy
  getPrivacy: () => apiClient.get('/admin/config/privacy'),
  createPrivacy: (data) => apiClient.post('/admin/config/privacy', data),
  updatePrivacy: (id, data) => apiClient.put(`/admin/config/privacy/${id}`, data),
  deletePrivacy: (id) => apiClient.delete(`/admin/config/privacy/${id}`),

  // Email templates (solo lectura + edicion + reset)
  getEmailTemplates: () => apiClient.get('/admin/config/email-templates'),
  updateEmailTemplate: (id, data) => apiClient.put(`/admin/config/email-templates/${id}`, data),
  resetEmailTemplates: () => apiClient.post('/admin/config/email-templates/reset'),
  previewEmailTemplate: (data) => apiClient.post('/admin/config/email-templates/preview', data),

  // Notificaciones Push (solo lectura + edicion + reset)
  getPushNotifications: () => apiClient.get('/admin/config/push-notifications'),
  updatePushNotification: (id, data) => apiClient.put(`/admin/config/push-notifications/${id}`, data),
  resetPushNotifications: () => apiClient.post('/admin/config/push-notifications/reset'),
};
