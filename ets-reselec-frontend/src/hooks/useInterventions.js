// ets-reselec-frontend/src/hooks/useInterventions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionService } from '../services/interventionService';
import toast from 'react-hot-toast';

export const useInterventions = (params = {}) => {
  return useQuery({
    queryKey: ['interventions', params],
    queryFn: () => interventionService.getAll(params).then(res => {
      if (res.data.success) {
        return {
          data: res.data.data,
          total: res.data.pagination?.total || res.data.data?.length || 0,
          pagination: res.data.pagination
        };
      }
      return { data: [], total: 0, pagination: null };
    }),
    keepPreviousData: true,
    staleTime: 60000 // 1 minute - interventions change frequently
  });
};

export const useIntervention = (id) => {
  return useQuery({
    queryKey: ['intervention', id],
    queryFn: () => interventionService.getById(id).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error('Failed to fetch intervention');
    }),
    enabled: !!id,
    staleTime: 60000
  });
};

export const useCreateIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interventionService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['dashboard-alerts']);
      if (response.data.success) {
        toast.success(response.data.message || 'Intervention créée avec succès');
      }
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
    onSuccess: (response) => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      if (response.data.success) {
        toast.success(response.data.message || 'Statut mis à jour avec succès');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      toast.error(message);
    }
  });
};

export const useInterventionWorkflow = (id) => {
  return useQuery({
    queryKey: ['intervention-workflow', id],
    queryFn: () => interventionService.getWorkflow(id).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error('Failed to fetch workflow');
    }),
    enabled: !!id,
    staleTime: 30000 // 30 seconds
  });
};

export const useUpdateDiagnostic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.updateDiagnostic(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      if (response.data.success) {
        toast.success(response.data.message || 'Diagnostic mis à jour avec succès');
      }
    }
  });
};

export const useUpdatePlanification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.updatePlanification(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      if (response.data.success) {
        toast.success(response.data.message || 'Planification mise à jour avec succès');
      }
    }
  });
};

export const useAddControleQualite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => interventionService.addControleQualite(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.id]);
      queryClient.invalidateQueries(['intervention', variables.id]);
      if (response.data.success) {
        toast.success(response.data.message || 'Contrôle qualité ajouté avec succès');
      }
    }
  });
};