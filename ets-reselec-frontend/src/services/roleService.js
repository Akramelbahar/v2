// src/services/roleService.js
import api from './api';

export const roleService = {
  // Get all roles
  getAll: () => 
    api.get('/roles'),
  
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
  getAllPermissions: () => 
    api.get('/permissions'),
  
  // Update role permissions
  updatePermissions: (roleId, permissionIds) => 
    api.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds }),
  
  // Get users by role
  getUsersByRole: (roleId) => 
    api.get(`/roles/${roleId}/users`)
};

export default roleService;