// src/services/equipmentService.js
import api from './api';

export const equipmentService = {
  // Get all equipment with pagination and filters
  getAll: (params = {}) => 
    api.get('/equipment', { params }),
  
  // Get equipment by ID
  getById: (id) => 
    api.get(`/equipment/${id}`),
  
  // Create new equipment
  create: (data) => 
    api.post('/equipment', data),
  
  // Update equipment
  update: (id, data) => 
    api.put(`/equipment/${id}`, data),
  
  // Delete equipment
  delete: (id) => 
    api.delete(`/equipment/${id}`),
  
  // Get equipment types
  getTypes: () => 
    api.get('/equipment/types'),
  
  // Search equipment
  search: (query, filters = {}) => 
    api.get('/equipment', { 
      params: { search: query, ...filters } 
    }),
  
  // Get equipment by client
  getByClient: (clientId) => 
    api.get('/equipment', { 
      params: { proprietaire_id: clientId } 
    })
};

export default equipmentService;