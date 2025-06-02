// src/services/permissionService.js
import api from './api';

export const permissionService = {
  // Get all permissions with pagination and filters
  getAll: (params = {}) => 
    api.get('/permissions', { params }),
  
  // Get permission by ID
  getById: (id) => 
    api.get(`/permissions/${id}`),
  
  // Create new permission
  create: (data) => 
    api.post('/permissions', data),
  
  // Update permission
  update: (id, data) => 
    api.put(`/permissions/${id}`, data),
  
  // Delete permission
  delete: (id) => 
    api.delete(`/permissions/${id}`),
  
  // Get permission modules
  getModules: () => 
    api.get('/permissions/modules')
};

export default permissionService;