import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionService } from '../services/interventionService';
import toast from 'react-hot-toast';

export const useInterventions = (params = {}) => {
  return useQuery({
    queryKey: ['interventions', params],
    queryFn: () => interventionService.getAll(params).then(res => res.data.data || res.data),
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
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['recent-interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Statut mis à jour avec succès');
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
    queryFn: () => interventionService.getWorkflow(id).then(res => res.data.data),
    enabled: !!id,
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
      toast.success('Diagnostic mis à jour avec succès');
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
      toast.success('Planification mise à jour avec succès');
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
      toast.success('Contrôle qualité ajouté avec succès');
    }
  });
};