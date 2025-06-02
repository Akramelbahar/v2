// src/services/permissionService.js
import api from './api';

export const permissionService = {
  // Get all permissions
  getAll: (limit = 100) => 
    api.get('/permissions', { params: { limit } }),
  
  // Get permissions grouped by module
  getGrouped: () => 
    api.get('/roles/permissions/all'),
  
  // Create new permission
  create: (data) => 
    api.post('/roles/permissions', data),
  
  // Update permission
  update: (id, data) => 
    api.put(`/roles/permissions/${id}`, data),
  
  // Delete permission
  delete: (id) => 
    api.delete(`/roles/permissions/${id}`),
  
  // Get permissions by module
  getByModule: (module) => 
    api.get('/permissions', { 
      params: { module } 
    }),
  
  // Check if user has permission
  checkPermission: (userId, permission) => 
    api.get(`/users/${userId}/permissions`).then(res => {
      const permissions = res.data.data?.permissionsList || [];
      return permissions.includes(permission);
    })
};

export default permissionService;