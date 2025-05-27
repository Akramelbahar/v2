// src/services/clientService.js
import api from './api';

export const clientService = {
  // Get all clients with pagination and filters
  getAll: (params = {}) => 
    api.get('/clients', { params }),
  
  // Get client by ID
  getById: (id) => 
    api.get(`/clients/${id}`),
  
  // Create new client
  create: (data) => 
    api.post('/clients', data),
  
  // Update client
  update: (id, data) => 
    api.put(`/clients/${id}`, data),
  
  // Delete client
  delete: (id) => 
    api.delete(`/clients/${id}`),
  
  // Get unique business sectors
  getSectors: () => 
    api.get('/clients/sectors'),
  
  // Search clients
  search: (query, filters = {}) => 
    api.get('/clients', { 
      params: { search: query, ...filters } 
    })
};

export default clientService;