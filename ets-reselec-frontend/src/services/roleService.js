// src/services/roleService.js
import api from './api';

export const roleService = {
  // Get all roles with pagination and filters
  getAll: (params = {}) => 
    api.get('/roles', { params }),
  
  // Get role by ID
  getById: (id) => 
    api.get(`/roles/${id}`),
  
  // Create new role
  create: (data) => 
    api.post('/roles', data),
  
  // Update role
  update: (id, data) => 
    api.put(`/roles/${id}`, data),
  
  // Delete role
  delete: (id) => 
    api.delete(`/roles/${id}`),
  
  // Get role permissions
  getPermissions: (id) => 
    api.get(`/roles/${id}/permissions`),
  
  // Update role permissions
  updatePermissions: (id, permissions) => 
    api.put(`/roles/${id}/permissions`, { permissions })
};

export default roleService;