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
  
  // Change user password
  changePassword: (id, newPassword) => 
    api.put(`/users/${id}/change-password`, { newPassword }),
  
  // Search users
  search: (query, filters = {}) => 
    api.get('/users', { 
      params: { search: query, ...filters } 
    })
};

export default userService;