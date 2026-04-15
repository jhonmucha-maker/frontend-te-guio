import apiClient from './apiClient';

export const ticketService = {
  getMyTickets: (params, opts) =>
    apiClient.get('/tickets', { params, ...opts }),

  getUnreadCount: () =>
    apiClient.get('/tickets/unread-count'),

  getTicketDetail: (id) =>
    apiClient.get(`/tickets/${id}`),

  createTicket: (data) =>
    apiClient.post('/tickets', data),

  sendMessage: (id, data) =>
    apiClient.post(`/tickets/${id}/messages`, data),

  markRead: (id) =>
    apiClient.patch(`/tickets/${id}/read`),

  acceptTicket: (id) =>
    apiClient.patch(`/tickets/${id}/accept`),

  closeTicket: (id, data) =>
    apiClient.patch(`/tickets/${id}/close`, data),
};
