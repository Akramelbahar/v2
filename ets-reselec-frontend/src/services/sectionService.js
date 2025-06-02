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
    })
};

export default sectionService;