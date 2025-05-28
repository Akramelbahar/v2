import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionService } from '../services/interventionService';
import toast from 'react-hot-toast';
import React from 'react';

export const useInterventions = (params = {}) => {
  return useQuery({
    queryKey: ['interventions', params],
    queryFn: () => interventionService.getAll(params).then(res => {
      // Handle the pagination response structure
      if (res.data.pagination) {
        return {
          data: res.data.data,
          total: res.data.pagination.total,
          pages: res.data.pagination.pages,
          page: res.data.pagination.page,
          limit: res.data.pagination.limit
        };
      }
      // Fallback for non-paginated responses
      return res.data.data || res.data;
    }),
    keepPreviousData: true,
    staleTime: 60000 // 1 minute - interventions change frequently
  });
};

export const useIntervention = (id) => {
  return useQuery({
    queryKey: ['intervention', id],
    queryFn: () => interventionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 60000
  });
};

export const useCreateIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interventionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['dashboard-alerts']);
      toast.success('Intervention créée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'intervention';
      toast.error(message);
    }
  });
};

export const useUpdateInterventionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => interventionService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['intervention', variables.id]);
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['dashboard-alerts']);
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      toast.error(message);
    }
  });
};

export const useInterventionWorkflow = (id, options = {}) => {
  return useQuery({
    queryKey: ['intervention-workflow', id],
    queryFn: () => interventionService.getWorkflow(id).then(res => {
      console.log('Workflow API Response:', res.data);
      return res.data.data; // Make sure we return the correct data structure
    }),
    enabled: !!id && (options.enabled !== false),
    staleTime: 30000 // 30 seconds
  });
};
export const useUpdateDiagnostic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.updateDiagnostic(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Diagnostic mis à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du diagnostic';
      toast.error(message);
    }
  });
};

export const useUpdatePlanification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.updatePlanification(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Planification mise à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour de la planification';
      toast.error(message);
    }
  });
};

export const useAddControleQualite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.addControleQualite(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Contrôle qualité mis à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du contrôle qualité';
      toast.error(message);
    }
  });
};

// Additional hooks for better workflow management
export const useUpdateIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['intervention', variables.id]);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Intervention modifiée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'intervention';
      toast.error(message);
    }
  });
};

export const useDeleteIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interventionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['recent-interventions']);
      toast.success('Intervention supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'intervention';
      toast.error(message);
    }
  });
};

export const useInterventionStatusCounts = () => {
  return useQuery({
    queryKey: ['intervention-status-counts'],
    queryFn: () => interventionService.getStatusCounts().then(res => res.data.data),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Auto-refetch every 5 minutes
  });
};

// Bulk operations
export const useBulkUpdateInterventions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }) => {
      const promises = ids.map(id => 
        interventionService.update(id, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Interventions mises à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des interventions');
    }
  });
};

// Search and filter hooks
export const useInterventionSearch = (query, filters = {}) => {
  return useQuery({
    queryKey: ['intervention-search', query, filters],
    queryFn: () => interventionService.search(query, filters).then(res => res.data.data),
    enabled: !!query && query.length >= 2,
    staleTime: 60000
  });
};

export const useInterventionsByEquipment = (equipmentId) => {
  return useQuery({
    queryKey: ['interventions-by-equipment', equipmentId],
    queryFn: () => interventionService.getByEquipment(equipmentId).then(res => res.data.data),
    enabled: !!equipmentId,
    staleTime: 300000
  });
};

export const useInterventionsByDateRange = (dateFrom, dateTo, filters = {}) => {
  return useQuery({
    queryKey: ['interventions-by-date', dateFrom, dateTo, filters],
    queryFn: () => interventionService.getByDateRange(dateFrom, dateTo, filters).then(res => res.data.data),
    enabled: !!(dateFrom && dateTo),
    staleTime: 300000
  });
};

// Analytics hooks
export const useInterventionAnalytics = (timeframe = '30') => {
  return useQuery({
    queryKey: ['intervention-analytics', timeframe],
    queryFn: () => interventionService.getAnalytics(timeframe).then(res => res.data.data),
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000
  });
};

// Real-time updates helper
export const useInterventionRealTimeUpdates = (interventionId) => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (!interventionId) return;
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['intervention-workflow', interventionId]);
      queryClient.invalidateQueries(['intervention', interventionId]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [interventionId, queryClient]);
};

export default {
  useInterventions,
  useIntervention,
  useCreateIntervention,
  useUpdateInterventionStatus,
  useInterventionWorkflow,
  useUpdateDiagnostic,
  useUpdatePlanification,
  useAddControleQualite,
  useUpdateIntervention,
  useDeleteIntervention,
  useInterventionStatusCounts,
  useBulkUpdateInterventions,
  useInterventionSearch,
  useInterventionsByEquipment,
  useInterventionsByDateRange,
  useInterventionAnalytics,
  useInterventionRealTimeUpdates
};