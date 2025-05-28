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
  
  // Update intervention
  update: (id, data) => 
    api.put(`/interventions/${id}`, data),
  
  // Delete intervention
  delete: (id) => 
    api.delete(`/interventions/${id}`),
  
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
    }),
  
  // Get interventions by client
  getByClient: (clientId) =>
    api.get('/interventions', {
      params: { client_id: clientId }
    }),
  
  // Get interventions by status
  getByStatus: (status) =>
    api.get('/interventions', {
      params: { statut: status }
    }),
  
  // Get urgent interventions
  getUrgent: () =>
    api.get('/interventions', {
      params: { urgence: true }
    }),
  
  // Get overdue interventions
  getOverdue: (days = 30) =>
    api.get('/interventions', {
      params: { 
        overdue: true,
        days: days
      }
    }),
  
  // Analytics and reporting
  getAnalytics: (timeframe = '30') =>
    api.get('/interventions/analytics', {
      params: { timeframe }
    }),
  
  // Get completion metrics
  getCompletionMetrics: (timeframe = '30') =>
    api.get('/interventions/completion-metrics', {
      params: { timeframe }
    }),
  
  // Export interventions
  exportToCsv: (filters = {}) =>
    api.get('/interventions/export/csv', {
      params: filters,
      responseType: 'blob'
    }),
  
  exportToPdf: (filters = {}) =>
    api.get('/interventions/export/pdf', {
      params: filters,
      responseType: 'blob'
    }),
  
  // Reports
  generateReport: (interventionId) =>
    api.post(`/interventions/${interventionId}/report`),
  
  getReports: (interventionId) =>
    api.get(`/interventions/${interventionId}/reports`),
  
  updateReport: (interventionId, reportId, data) =>
    api.put(`/interventions/${interventionId}/reports/${reportId}`, data),
  
  // Workflow management
  getWorkflowHistory: (interventionId) =>
    api.get(`/interventions/${interventionId}/workflow/history`),
  
  addWorkflowNote: (interventionId, note) =>
    api.post(`/interventions/${interventionId}/workflow/notes`, { note }),
  
  // Attachments
  uploadAttachment: (interventionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/interventions/${interventionId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  getAttachments: (interventionId) =>
    api.get(`/interventions/${interventionId}/attachments`),
  
  deleteAttachment: (interventionId, attachmentId) =>
    api.delete(`/interventions/${interventionId}/attachments/${attachmentId}`),
  
  // Comments/Notes
  addComment: (interventionId, comment) =>
    api.post(`/interventions/${interventionId}/comments`, { comment }),
  
  getComments: (interventionId) =>
    api.get(`/interventions/${interventionId}/comments`),
  
  updateComment: (interventionId, commentId, comment) =>
    api.put(`/interventions/${interventionId}/comments/${commentId}`, { comment }),
  
  deleteComment: (interventionId, commentId) =>
    api.delete(`/interventions/${interventionId}/comments/${commentId}`),
  
  // Scheduling
  scheduleIntervention: (interventionId, scheduleData) =>
    api.post(`/interventions/${interventionId}/schedule`, scheduleData),
  
  rescheduleIntervention: (interventionId, newDate) =>
    api.put(`/interventions/${interventionId}/schedule`, { date: newDate }),
  
  // Assignment
  assignTechnician: (interventionId, technicianId) =>
    api.put(`/interventions/${interventionId}/assign`, { technicianId }),
  
  unassignTechnician: (interventionId) =>
    api.delete(`/interventions/${interventionId}/assign`),
  
  // Time tracking
  startTimer: (interventionId) =>
    api.post(`/interventions/${interventionId}/timer/start`),
  
  stopTimer: (interventionId) =>
    api.post(`/interventions/${interventionId}/timer/stop`),
  
  getTimeLog: (interventionId) =>
    api.get(`/interventions/${interventionId}/timer/log`),
  
  // Parts and materials
  addMaterial: (interventionId, materialData) =>
    api.post(`/interventions/${interventionId}/materials`, materialData),
  
  getMaterials: (interventionId) =>
    api.get(`/interventions/${interventionId}/materials`),
  
  updateMaterial: (interventionId, materialId, materialData) =>
    api.put(`/interventions/${interventionId}/materials/${materialId}`, materialData),
  
  deleteMaterial: (interventionId, materialId) =>
    api.delete(`/interventions/${interventionId}/materials/${materialId}`),
  
  // Notifications
  sendNotification: (interventionId, notificationData) =>
    api.post(`/interventions/${interventionId}/notifications`, notificationData),
  
  // Templates
  getTemplates: () =>
    api.get('/interventions/templates'),
  
  createFromTemplate: (templateId, data) =>
    api.post(`/interventions/templates/${templateId}/create`, data),
  
  // Bulk operations
  bulkUpdate: (interventionIds, updateData) =>
    api.put('/interventions/bulk', { ids: interventionIds, data: updateData }),
  
  bulkDelete: (interventionIds) =>
    api.delete('/interventions/bulk', { data: { ids: interventionIds } }),
  
  bulkAssign: (interventionIds, technicianId) =>
    api.put('/interventions/bulk/assign', { ids: interventionIds, technicianId }),
  
  bulkStatusUpdate: (interventionIds, status) =>
    api.put('/interventions/bulk/status', { ids: interventionIds, status }),
  
  // Quality assurance
  submitForReview: (interventionId) =>
    api.post(`/interventions/${interventionId}/review/submit`),
  
  approveIntervention: (interventionId, approvalData) =>
    api.post(`/interventions/${interventionId}/review/approve`, approvalData),
  
  rejectIntervention: (interventionId, rejectionData) =>
    api.post(`/interventions/${interventionId}/review/reject`, rejectionData),
  
  // Integration endpoints
  syncWithExternalSystem: (interventionId, systemData) =>
    api.post(`/interventions/${interventionId}/sync`, systemData),
  
  // Performance metrics
  getPerformanceMetrics: (timeframe = '30') =>
    api.get('/interventions/performance', { params: { timeframe } }),
  
  // Custom fields
  updateCustomFields: (interventionId, customFields) =>
    api.put(`/interventions/${interventionId}/custom-fields`, customFields),
  
  // Checklists
  getChecklist: (interventionId) =>
    api.get(`/interventions/${interventionId}/checklist`),
  
  updateChecklistItem: (interventionId, itemId, checked) =>
    api.put(`/interventions/${interventionId}/checklist/${itemId}`, { checked })
};

export default interventionService;