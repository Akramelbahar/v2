import api from './api';

export const sectionService = {
  getAll: (params = {}) => 
    api.get('/sections', { params }),
  
  getById: (id) => 
    api.get(`/sections/${id}`),
  
  create: (data) => 
    api.post('/sections', data),
  
  update: (id, data) => 
    api.put(`/sections/${id}`, data),
  
  delete: (id) => 
    api.delete(`/sections/${id}`),
  
  getAvailableUsers: () =>
    api.get('/sections/users'),
    
  assignUsers: (id, userIds) => 
    api.post(`/sections/${id}/assign-users`, { userIds })
};

export default sectionService;