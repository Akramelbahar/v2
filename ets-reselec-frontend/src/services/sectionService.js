// src/services/sectionService.js
import api from './api';

export const sectionService = {
  // Get all sections
  getAll: (params = {}) => 
    api.get('/sections', { params }),
  
  // Get section by ID
  getById: (id) => 
    api.get(`/sections/${id}`),
  
  // Get section users
  getSectionUsers: (id, params = {}) => 
    api.get(`/sections/${id}/users`, { params }),
  
  // Get section interventions
  getSectionInterventions: (id, params = {}) => 
    api.get(`/sections/${id}/interventions`, { params }),
  
  // Get section equipment
  getSectionEquipment: (id, params = {}) => 
    api.get(`/sections/${id}/equipment`, { params }),
  
  // Get section statistics
  getSectionStatistics: (id) => 
    api.get(`/sections/${id}/stats`),
  
  // Create new section
  create: (data) => 
    api.post('/sections', data),
  
  // Update section
  update: (id, data) => 
    api.put(`/sections/${id}`, data),
  
  // Delete section
  delete: (id) => 
    api.delete(`/sections/${id}`),
  
  // Search sections
  search: (query, params = {}) => 
    api.get('/sections', { 
      params: { search: query, ...params } 
    })
};

export default sectionService;