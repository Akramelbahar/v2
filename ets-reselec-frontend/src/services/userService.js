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
  
  // Reset user password
  resetPassword: (id, data) => 
    api.put(`/users/${id}/reset-password`, data),
  
  // Toggle user status (active/inactive)
  toggleStatus: (id, status) => 
    api.put(`/users/${id}/status`, { actif: status }),
  
  // Get user statistics
  getStats: () => 
    api.get('/users/stats'),
  
  // Search users
  search: (query, filters = {}) => 
    api.get('/users', { 
      params: { search: query, ...filters } 
    }),
  
  // Get users by role
  getByRole: (roleId) => 
    api.get('/users', { 
      params: { role_id: roleId } 
    }),
  
  // Get users by section
  getBySection: (sectionId) => 
    api.get('/users', { 
      params: { section_id: sectionId } 
    }),
  
  // Assign role to user
  assignRole: (userId, roleId) => 
    api.put(`/users/${userId}/role`, { role_id: roleId }),
  
  // Get user activity log
  getActivityLog: (userId, params = {}) => 
    api.get(`/users/${userId}/activity`, { params }),
  
  // Import users from CSV/Excel
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Export users to CSV/Excel
  export: (format = 'csv', filters = {}) => 
    api.get('/users/export', {
      params: { format, ...filters },
      responseType: 'blob'
    })
};

export default userService;