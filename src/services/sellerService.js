import apiClient from './apiClient';

const UPLOAD_TIMEOUT = 60000; // 60s timeout para uploads

export const sellerService = {
  // Perfil vendedor
  getProfile: () => apiClient.get('/seller/profile'),
  updateProfile: (data) => apiClient.patch('/seller/profile', data),
  uploadProfileImage: (formData) =>
    apiClient.post('/seller/profile/image', formData, { timeout: 60000 }),

  // Resubmit producto
  resubmitProduct: (id) => apiClient.post(`/seller/products/${id}/resubmit`),

  // Tiendas
  getMyStores: (opts) => apiClient.get('/seller/stores', opts),
  createStore: (formData) =>
    apiClient.post('/seller/stores', formData, { timeout: UPLOAD_TIMEOUT }),
  updateStore: (id, formData) =>
    apiClient.put(`/seller/stores/${id}`, formData, { timeout: UPLOAD_TIMEOUT }),

  // Productos
  getMyProducts: (params, opts) => apiClient.get('/seller/products', { params, ...opts }),
  createProduct: (formData) =>
    apiClient.post('/seller/products', formData, { timeout: UPLOAD_TIMEOUT }),
  updateProduct: (id, formData) =>
    apiClient.put(`/seller/products/${id}`, formData, { timeout: UPLOAD_TIMEOUT }),
  updatePrice: (id, precio) =>
    apiClient.patch(`/seller/products/${id}/price`, { precio }),
  toggleProduct: (id) =>
    apiClient.patch(`/seller/products/${id}/toggle`),

  // Suscripciones
  getMySubscriptions: (opts) => apiClient.get('/seller/subscriptions', opts),
  requestSubscription: (formData) =>
    apiClient.post('/seller/subscriptions', formData, { timeout: UPLOAD_TIMEOUT }),

  // Resubmit store (after rejection)
  resubmitStore: (id, formData) =>
    apiClient.put(`/seller/stores/${id}/resubmit`, formData, { timeout: UPLOAD_TIMEOUT }),

  // Delete store
  deleteStore: (id) => apiClient.delete(`/seller/stores/${id}`),

  // Delete product
  deleteProduct: (id) => apiClient.delete(`/seller/products/${id}`),

  // Store photos
  addStorePhotos: (id, formData) =>
    apiClient.post(`/seller/stores/${id}/photos`, formData, { timeout: UPLOAD_TIMEOUT }),
  deleteStorePhoto: (storeId, photoId) =>
    apiClient.delete(`/seller/stores/${storeId}/photos/${photoId}`),

  // Product photos
  addProductPhotos: (id, formData) =>
    apiClient.post(`/seller/products/${id}/photos`, formData, { timeout: UPLOAD_TIMEOUT }),
  deleteProductPhoto: (productId, photoId) =>
    apiClient.delete(`/seller/products/${productId}/photos/${photoId}`),

  // Seller documents
  uploadDocs: (formData) =>
    apiClient.post('/seller/docs', formData, { timeout: UPLOAD_TIMEOUT }),
};
