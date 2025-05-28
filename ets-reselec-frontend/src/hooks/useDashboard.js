// ets-reselec-frontend/src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useDashboardStats = (timeframe = '30') => {
  return useQuery({
    queryKey: ['dashboard-stats', timeframe],
    queryFn: () => dashboardService.getStats(timeframe).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000 // Consider data stale after 25 seconds
  });
};

export const useRecentInterventions = (limit = 10) => {
  return useQuery({
    queryKey: ['recent-interventions', limit],
    queryFn: () => dashboardService.getRecentInterventions(limit).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return [];
    }),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 50000
  });
};

export const useDashboardAlerts = () => {
  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => dashboardService.getAlerts().then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    }),
    refetchInterval: 30000,
    staleTime: 25000
  });
};

export const useChartsData = (period = 'month') => {
  return useQuery({
    queryKey: ['dashboard-charts', period],
    queryFn: () => dashboardService.getChartsData(period).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    }),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000
  });
};

export const usePerformanceMetrics = (timeframe = '30') => {
  return useQuery({
    queryKey: ['performance-metrics', timeframe],
    queryFn: () => dashboardService.getPerformanceMetrics(timeframe).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    }),
    refetchInterval: 300000,
    staleTime: 240000
  });
};