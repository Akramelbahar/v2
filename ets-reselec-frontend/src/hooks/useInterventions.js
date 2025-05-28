// src/hooks/useInterventions.js - Enhanced version
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
      throw error;
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
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      toast.error(message);
      throw error;
    }
  });
};

export const useInterventionWorkflow = (id) => {
  return useQuery({
    queryKey: ['intervention-workflow', id],
    queryFn: () => interventionService.getWorkflow(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
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
      throw error;
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
      throw error;
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
      toast.success('Contrôle qualité ajouté avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'ajout du contrôle qualité';
      toast.error(message);
      throw error;
    }
  });
};

// Enhanced workflow management hooks
export const useWorkflowTransition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ interventionId, fromStep, toStep, data }) => {
      // Handle workflow transitions with validation
      const transitions = {
        'diagnostic-to-planification': () => interventionService.updateDiagnostic(interventionId, data),
        'planification-to-execution': () => interventionService.updatePlanification(interventionId, data),
        'execution-to-controle': () => interventionService.addControleQualite(interventionId, data),
        'controle-to-completion': () => interventionService.updateStatus(interventionId, 'TERMINEE')
      };
      
      const transitionKey = `${fromStep}-to-${toStep}`;
      const transitionFn = transitions[transitionKey];
      
      if (!transitionFn) {
        throw new Error(`Transition non supportée: ${fromStep} -> ${toStep}`);
      }
      
      return transitionFn();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['intervention-workflow', variables.interventionId]);
      queryClient.invalidateQueries(['intervention', variables.interventionId]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Étape du workflow mise à jour');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la transition du workflow';
      toast.error(message);
      throw error;
    }
  });
};

export const useWorkflowValidation = (intervention, currentStep) => {
  return useQuery({
    queryKey: ['workflow-validation', intervention?.id, currentStep],
    queryFn: async () => {
      if (!intervention) return { canProceed: false, issues: [] };
      
      const issues = [];
      let canProceed = true;
      
      switch (currentStep) {
        case 'diagnostic':
          if (!intervention.description) {
            issues.push('Description de l\'intervention requise');
            canProceed = false;
          }
          break;
          
        case 'planification':
          // Add planification validation logic
          break;
          
        case 'controle':
          // Add quality control validation logic
          break;
          
        default:
          break;
      }
      
      return { canProceed, issues };
    },
    enabled: !!intervention,
    staleTime: 10000
  });
};

export const useWorkflowProgress = (interventionId) => {
  const { data: workflow } = useInterventionWorkflow(interventionId);
  
  const calculateProgress = () => {
    if (!workflow?.phases) return 0;
    
    const phases = Object.values(workflow.phases);
    const completedPhases = phases.filter(phase => phase.completed).length;
    const totalPhases = phases.length;
    
    return totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
  };
  
  const getNextAction = () => {
    if (!workflow?.phases) return null;
    
    const phases = workflow.phases;
    
    if (!phases.diagnostic?.completed) {
      return 'Compléter le diagnostic';
    }
    if (!phases.planification?.completed) {
      return 'Finaliser la planification';
    }
    if (!phases.controleQualite?.completed) {
      return 'Effectuer le contrôle qualité';
    }
    
    return 'Finaliser l\'intervention';
  };
  
  const getCurrentStep = () => {
    if (!workflow?.phases) return 'intervention';
    
    const phases = workflow.phases;
    
    if (!phases.diagnostic?.completed) return 'diagnostic';
    if (!phases.planification?.completed) return 'planification';
    if (!phases.controleQualite?.completed) return 'controle';
    
    return 'completed';
  };
  
  return {
    progress: calculateProgress(),
    nextAction: getNextAction(),
    currentStep: getCurrentStep(),
    workflow
  };
};

// Batch operations for multiple interventions
export const useBatchUpdateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ interventionIds, status }) => {
      const results = await Promise.allSettled(
        interventionIds.map(id => interventionService.updateStatus(id, status))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { successful, failed, total: interventionIds.length };
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      
      if (results.failed > 0) {
        toast.error(`${results.successful} mises à jour réussies, ${results.failed} échecs`);
      } else {
        toast.success(`${results.successful} interventions mises à jour avec succès`);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour en lot');
      throw error;
    }
  });
};

export const useInterventionStats = (interventionId) => {
  return useQuery({
    queryKey: ['intervention-stats', interventionId],
    queryFn: async () => {
      const intervention = await interventionService.getById(interventionId).then(res => res.data.data);
      
      // Calculate various stats
      const createdDate = new Date(intervention.date);
      const now = new Date();
      const daysOpen = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      return {
        daysOpen,
        isOverdue: daysOpen > 30 && intervention.statut !== 'TERMINEE',
        isUrgent: intervention.urgence,
        estimatedCompletion: intervention.statut === 'EN_COURS' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null
      };
    },
    enabled: !!interventionId,
    staleTime: 300000 // 5 minutes
  });
};