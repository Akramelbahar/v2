// src/services/dashboardService.js
import api from './api';

export const dashboardService = {
  // Get dashboard statistics
  getStats: (timeframe = '30') => 
    api.get('/dashboard/stats', { params: { timeframe } }),
  
  // Get recent interventions
  getRecentInterventions: (limit = 10) => 
    api.get('/dashboard/recent-interventions', { params: { limit } }),
  
  // Get dashboard alerts
  getAlerts: () => 
    api.get('/dashboard/alerts'),
  
  // Get charts data
  getChartsData: (period = 'month') => 
    api.get('/dashboard/charts', { params: { period } }),
  
  // Get performance metrics
  getPerformanceMetrics: (timeframe = '30') => 
    api.get('/dashboard/performance', { params: { timeframe } })
};

export default dashboardService;