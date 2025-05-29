// src/services/sectionService.js
import api from './api';

export const sectionService = {
  // Get all sections with pagination and filters
  getAll: (params = {}) => 
    api.get('/sections', { params }),
  
  // Get section by ID
  getById: (id) => 
    api.get(`/sections/${id}`),
  
  // Create new section
  create: (data) => 
    api.post('/sections', data),
  
  // Update section
  update: (id, data) => 
    api.put(`/sections/${id}`, data),
  
  // Delete section
  delete: (id) => 
    api.delete(`/sections/${id}`),
  
  // Get section types
  getTypes: () => 
    api.get('/sections/types'),
  
  // Search sections
  search: (query, filters = {}) => 
    api.get('/sections', { 
      params: { search: query, ...filters } 
    }),
  
  // Get sections by type
  getByType: (type) => 
    api.get('/sections', { 
      params: { type } 
    }),
  
  // Get section statistics
  getStats: (id) => 
    api.get(`/sections/${id}/stats`),
  
  // Get users in section
  getUsers: (id, params = {}) => 
    api.get(`/sections/${id}/users`, { params }),
  
  // Assign user to section
  assignUser: (id, userId) => 
    api.put(`/sections/${id}/users/${userId}`),
  
  // Remove user from section
  removeUser: (id, userId) => 
    api.delete(`/sections/${id}/users/${userId}`),
  
  // Set section manager
  setManager: (id, userId) => 
    api.put(`/sections/${id}/manager`, { responsable_id: userId }),
  
  // Get section interventions
  getInterventions: (id, params = {}) => 
    api.get(`/sections/${id}/interventions`, { params })
};

export default sectionService;