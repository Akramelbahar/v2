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
  
  // Get all permissions
  getPermissions: () => 
    api.get('/permissions'),
  
  // Get permissions by module
  getPermissionsByModule: (module) => 
    api.get('/permissions', { params: { module } }),
  
  // Assign permissions to role
  assignPermissions: (roleId, permissionIds) => 
    api.put(`/roles/${roleId}/permissions`, { permissions: permissionIds }),
  
  // Remove permissions from role
  removePermissions: (roleId, permissionIds) => 
    api.delete(`/roles/${roleId}/permissions`, { data: { permissions: permissionIds } }),
  
  // Assign role to user
  assignToUser: (userId, roleId) => 
    api.put(`/users/${userId}/role`, { role_id: roleId }),
  
  // Remove role from user
  removeFromUser: (userId) => 
    api.delete(`/users/${userId}/role`),
  
  // Get role statistics
  getStats: () => 
    api.get('/roles/stats'),
  
  // Search roles
  search: (query, filters = {}) => 
    api.get('/roles', { 
      params: { search: query, ...filters } 
    }),
  
  // Clone role
  clone: (id, newName) => 
    api.post(`/roles/${id}/clone`, { nom: newName }),
  
  // Get default roles
  getDefaults: () => 
    api.get('/roles/defaults'),
  
  // Export role configuration
  export: (id) => 
    api.get(`/roles/${id}/export`, {
      responseType: 'blob'
    }),
  
  // Import role configuration
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/roles/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default roleService;