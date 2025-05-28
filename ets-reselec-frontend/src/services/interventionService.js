// src/services/interventionService.js
import api from './api';

export const interventionService = {
  // Get all interventions with pagination and filters
  getAll: (params = {}) => 
    api.get('/interventions', { params }),
  
  // Get intervention by ID
  getById: (id) => 
    api.get(`/interventions/${id}`),
  
  // Create new intervention
  create: (data) => 
    api.post('/interventions', data),
  
  // Update intervention status
  updateStatus: (id, status) => 
    api.put(`/interventions/${id}/status`, { statut: status }),
  
  // Get workflow status
  getWorkflow: (id) => 
    api.get(`/interventions/${id}/workflow`),
  
  // Update diagnostic phase
  updateDiagnostic: (id, data) => 
    api.post(`/interventions/${id}/diagnostic`, data),
  
  // Update planning phase
  updatePlanification: (id, data) => 
    api.put(`/interventions/${id}/planification`, data),
  
  // Add quality control
  addControleQualite: (id, data) => 
    api.post(`/interventions/${id}/controle-qualite`, data),
  
  // Get status counts
  getStatusCounts: () => 
    api.get('/interventions/status-counts'),
  
  // Search interventions
  search: (query, filters = {}) => 
    api.get('/interventions', { 
      params: { search: query, ...filters } 
    }),
  
  // Get interventions by equipment
  getByEquipment: (equipmentId) => 
    api.get('/interventions', { 
      params: { equipement_id: equipmentId } 
    }),
  
  // Get interventions by date range
  getByDateRange: (dateFrom, dateTo, filters = {}) => 
    api.get('/interventions', { 
      params: { dateFrom, dateTo, ...filters } 
    })
};

import { workflowService } from './workflowService';

// Enhance existing intervention data
export const getInterventionWithWorkflow = async (id) => {
  const intervention = await interventionService.getById(id);
  return workflowService.enrichInterventionData(intervention.data);
};

export default interventionService;