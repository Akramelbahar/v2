

// ets-reselec-frontend/src/services/exportService.js
import api from './api';

export const exportService = {
  exportData: (config) =>
    api.post('/export/data', config, { responseType: 'blob' }),
  
  importData: (file, entityType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    
    return api.post('/import/data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getImportTemplate: (entityType) =>
    api.get(`/export/template/${entityType}`, { responseType: 'blob' })
};
