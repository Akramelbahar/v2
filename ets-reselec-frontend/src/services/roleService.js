// src/services/roleService.js
import api from './api';

export const roleService = {
  // Get all roles with pagination and filters
  getAll: (params = {}) => 
    api.get('/roles', { params }),
  
  // Get role by ID with permissions
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
  
  // Update role permissions
  updatePermissions: (roleId, permissionIds) => 
    api.put(`/roles/${roleId}/permissions`, { permissionIds }),
  
  // Get role statistics
  getStatistics: () => 
    api.get('/roles/statistics'),
  
  // Search roles
  search: (query, filters = {}) => 
    api.get('/roles', { 
      params: { search: query, ...filters } 
    }),
  
  // Get users by role
  getUsersByRole: (roleId) => 
    api.get(`/roles/${roleId}/users`),
  
  // Assign role to user
  assignRole: (userId, roleId) => 
    api.put(`/users/${userId}/role`, { roleId }),
  
  // Remove role from user
  removeRole: (userId) => 
    api.delete(`/users/${userId}/role`),
  
  // Get permission modules
  getPermissionModules: () => 
    api.get('/permissions/modules'),
  
  // Create permission
  createPermission: (data) => 
    api.post('/permissions', data),
  
  // Update permission
  updatePermission: (id, data) => 
    api.put(`/permissions/${id}`, data),
  
  // Delete permission
  deletePermission: (id) => 
    api.delete(`/permissions/${id}`),
  
  // Bulk operations
  bulkAssignRole: (userIds, roleId) => 
    api.post('/roles/bulk-assign', { userIds, roleId }),
  
  bulkRemoveRole: (userIds) => 
    api.post('/roles/bulk-remove', { userIds }),
  
  // Role templates
  getRoleTemplates: () => 
    api.get('/roles/templates'),
  
  createFromTemplate: (templateId, roleName) => 
    api.post('/roles/from-template', { templateId, roleName }),
  
  // Export/Import
  exportRoles: () => 
    api.get('/roles/export', { responseType: 'blob' }),
  
  importRoles: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/roles/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default roleService;