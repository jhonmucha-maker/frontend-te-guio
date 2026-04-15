import apiClient from './apiClient';

export const buyerService = {
  // Perfil
  getProfile: () => apiClient.get('/me/profile'),
  updateProfile: (data) => apiClient.patch('/me/profile', data),
  uploadProfileImage: (formData) =>
    apiClient.post('/me/profile/image', formData, { timeout: 60000 }),
  changePassword: (contrasena_actual, nueva_contrasena) =>
    apiClient.patch('/me/password', { contrasena_actual, nueva_contrasena }),

  // Favoritos
  getFavoriteProducts: () => apiClient.get('/me/favorites/products'),
  toggleFavoriteProduct: (id_producto) =>
    apiClient.post(`/me/favorites/products/${id_producto}`),
  removeFavoriteProduct: (id_producto) =>
    apiClient.delete(`/me/favorites/products/${id_producto}`),

  getFavoriteStores: () => apiClient.get('/me/favorites/stores'),
  toggleFavoriteStore: (id_tienda) =>
    apiClient.post(`/me/favorites/stores/${id_tienda}`),
  removeFavoriteStore: (id_tienda) =>
    apiClient.delete(`/me/favorites/stores/${id_tienda}`),

  // Lista de compras
  getShoppingList: () => apiClient.get('/me/shopping-list'),
  addShoppingItem: (data) => apiClient.post('/me/shopping-list/items', data),
  updateShoppingItem: (id, data) =>
    apiClient.put(`/me/shopping-list/items/${id}`, data),
  markPurchased: (id) =>
    apiClient.patch(`/me/shopping-list/items/${id}/purchased`),
  unmarkPurchased: (id) =>
    apiClient.patch(`/me/shopping-list/items/${id}/unpurchased`),
  deleteShoppingItem: (id) =>
    apiClient.delete(`/me/shopping-list/items/${id}`),
  getShoppingHistory: (params) => apiClient.get('/me/shopping-history', { params }),

  // Tiendas donde el comprador ha comprado
  getPurchasedStores: () => apiClient.get('/me/purchased-stores'),

  // Calificaciones
  rateProduct: (data) => apiClient.post('/me/ratings/product', data),
  rateStore: (data) => apiClient.post('/me/ratings/store', data),
  getMyRatings: () => apiClient.get('/me/ratings'),
};
