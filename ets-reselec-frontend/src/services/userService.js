// src/services/userService.js
import api from './api';

export const userService = {
  // Get all users with pagination and filters
  getAll: (params = {}) => 
    api.get('/users', { params }),
  
  // Get user by ID
  getById: (id) => 
    api.get(`/users/${id}`),
  
  // Create new user
  create: (data) => 
    api.post('/users', data),
  
  // Update user
  update: (id, data) => 
    api.put(`/users/${id}`, data),
  
  // Delete user
  delete: (id) => 
    api.delete(`/users/${id}`),
  
  // Update user role
  updateRole: (id, roleId) => 
    api.put(`/users/${id}/role`, { role_id: roleId }),
  
  // Reset user password
  resetPassword: (id) => 
    api.post(`/users/${id}/reset-password`),
  
  // Toggle user status (enable/disable)
  updateStatus: (id, enabled) => 
    api.put(`/users/${id}/status`, { enabled }),
  
  // Get user permissions
  getUserPermissions: (id) => 
    api.get(`/users/${id}/permissions`),
  
  // Search users
  search: (query, params = {}) => 
    api.get('/users', { 
      params: { search: query, ...params } 
    }),
  
  // Get users by role
  getUsersByRole: (roleId, params = {}) => 
    api.get('/users', { 
      params: { role_id: roleId, ...params } 
    }),
  
  // Get users by section
  getUsersBySection: (section, params = {}) => 
    api.get('/users', { 
      params: { section, ...params } 
    }),
  
  // Get enabled/disabled users
  getEnabledUsers: (enabled = true, params = {}) => 
    api.get('/users', { 
      params: { enabled: enabled.toString(), ...params } 
    })
};

export default userService;