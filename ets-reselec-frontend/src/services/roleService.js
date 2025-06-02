// src/services/roleService.js
import api from './api';

export const roleService = {
  // Get all roles with pagination
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
  
  // Get all permissions (grouped and ungrouped)
  getAllPermissions: () => 
    api.get('/roles/permissions/all'),
  
  // Create new permission
  createPermission: (data) => 
    api.post('/roles/permissions', data),
  
  // Update permission
  updatePermission: (id, data) => 
    api.put(`/roles/permissions/${id}`, data),
  
  // Delete permission
  deletePermission: (id) => 
    api.delete(`/roles/permissions/${id}`),
  
  // Assign permissions to role
  assignPermissionsToRole: (roleId, permissions) => 
    api.post(`/roles/${roleId}/permissions`, { permissions }),
  
  // Search roles
  search: (query, params = {}) => 
    api.get('/roles', { 
      params: { search: query, ...params } 
    })
};

export default roleService;