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
  
  // Enable/disable user
  toggleStatus: (id, enabled) => 
    api.put(`/users/${id}/status`, { enabled }),
  
  // Get user permissions
  getPermissions: (id) => 
    api.get(`/users/${id}/permissions`),
  
  // Search users
  search: (query, filters = {}) => 
    api.get('/users', { 
      params: { search: query, ...filters } 
    })
};

export default userService; 