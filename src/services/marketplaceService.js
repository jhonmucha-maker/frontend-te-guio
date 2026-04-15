import apiClient from './apiClient';

export const marketplaceService = {
  searchProducts: (params) =>
    apiClient.get('/marketplace/products', { params }),

  searchStores: (params) =>
    apiClient.get('/marketplace/stores', { params }),

  getProductDetail: (id) =>
    apiClient.get(`/marketplace/products/${id}`),

  getStoreDetail: (id) =>
    apiClient.get(`/marketplace/stores/${id}`),

  getProductRatings: (id, params) =>
    apiClient.get(`/marketplace/products/${id}/ratings`, { params }),

  getStoreRatings: (id, params) =>
    apiClient.get(`/marketplace/stores/${id}/ratings`, { params }),
};
