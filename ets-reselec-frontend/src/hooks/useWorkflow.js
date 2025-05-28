// ets-reselec-frontend/src/hooks/useWorkflow.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import toast from 'react-hot-toast';

// Get intervention workflow
export const useInterventionWorkflow = (interventionId) => {
  return useQuery({
    queryKey: ['workflow', 'intervention', interventionId],
    queryFn: () => workflowService.getInterventionWorkflow(interventionId).then(res => res.data.data),
    enabled: !!interventionId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
    onError: (error) => {
      console.error('Failed to fetch workflow:', error);
      toast.error('Erreur lors du chargement du workflow');
    }
  });
};

// Transition intervention status
export const useTransitionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, reason }) => 
      workflowService.transitionStatus(id, status, reason),
    onSuccess: (data, variables) => {
      // Invalidate and refetch workflow data
      queryClient.invalidateQueries(['workflow', 'intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['workflow', 'dashboard']);
      
      const statusLabels = {
        'PLANIFIEE': 'Planifiée',
        'EN_ATTENTE_PDR': 'En Attente PDR',
        'EN_COURS': 'En Cours',
        'EN_PAUSE': 'En Pause',
        'TERMINEE': 'Terminée',
        'ANNULEE': 'Annulée',
        'ECHEC': 'Échec'
      };
      
      toast.success(`Statut changé vers: ${statusLabels[variables.status]}`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(message);
    }
  });
};

// Update diagnostic phase
export const useUpdateDiagnostic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => {
      // Validate data before sending
      const validation = workflowService.validateDiagnostic(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return workflowService.updateDiagnostic(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workflow', 'intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Phase diagnostic mise à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du diagnostic';
      toast.error(message);
    }
  });
};

// Update planning phase
export const useUpdatePlanification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => {
      // Validate data before sending
      const validation = workflowService.validatePlanification(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return workflowService.updatePlanification(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workflow', 'intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      toast.success('Planification mise à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour de la planification';
      toast.error(message);
    }
  });
};

// Add quality control
export const useAddControleQualite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => {
      // Validate data before sending
      const validation = workflowService.validateControleQualite(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return workflowService.addControleQualite(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workflow', 'intervention', variables.id]);
      queryClient.invalidateQueries(['interventions']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Contrôle qualité ajouté avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de l\'ajout du contrôle qualité';
      toast.error(message);
    }
  });
};

// Get workflow dashboard
export const useWorkflowDashboard = (timeframe = '30') => {
  return useQuery({
    queryKey: ['workflow', 'dashboard', timeframe],
    queryFn: () => workflowService.getDashboard(timeframe).then(res => res.data.data),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    onError: (error) => {
      console.error('Failed to fetch workflow dashboard:', error);
      toast.error('Erreur lors du chargement du tableau de bord workflow');
    }
  });
};

// Get workflow timeline
export const useWorkflowTimeline = (interventionId) => {
  return useQuery({
    queryKey: ['workflow', 'timeline', interventionId],
    queryFn: () => workflowService.getTimeline(interventionId).then(res => res.data.data),
    enabled: !!interventionId,
    staleTime: 300000, // 5 minutes
    onError: (error) => {
      console.error('Failed to fetch workflow timeline:', error);
    }
  });
};

// Get workflow templates
export const useWorkflowTemplates = () => {
  return useQuery({
    queryKey: ['workflow', 'templates'],
    queryFn: () => workflowService.getTemplates().then(res => res.data.data),
    staleTime: 3600000, // 1 hour - templates don't change often
    onError: (error) => {
      console.error('Failed to fetch workflow templates:', error);
    }
  });
};

// Get workflow statistics
export const useWorkflowStatistics = (timeframe = '30') => {
  return useQuery({
    queryKey: ['workflow', 'statistics', timeframe],
    queryFn: () => workflowService.getStatistics(timeframe).then(res => res.data.data),
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000,
    onError: (error) => {
      console.error('Failed to fetch workflow statistics:', error);
    }
  });
};

// Custom hook for workflow state management
export const useWorkflowState = (workflow) => {
  const canTransition = (targetStatus) => {
    if (!workflow?.intervention?.statut) return false;
    return workflowService.canTransition(workflow.intervention.statut, targetStatus);
  };
  
  const getCurrentPhase = () => {
    if (!workflow?.intervention?.statut) return 'UNKNOWN';
    return workflowService.getWorkflowPhase(workflow.intervention.statut);
  };
  
  const getCompletionPercentage = () => {
    if (!workflow) return 0;
    return workflowService.calculateCompletion(workflow);
  };
  
  const getNextActions = () => {
    if (!workflow?.nextActions) return [];
    return workflow.nextActions;
  };
  
  const isPhaseCompleted = (phase) => {
    if (!workflow?.phases) return false;
    return workflow.phases[phase]?.completed || false;
  };
  
  const isUrgent = () => {
    return workflow?.intervention?.urgence || false;
  };
  
  const isOverdue = () => {
    if (!workflow?.intervention) return false;
    
    const { statut, date } = workflow.intervention;
    if (statut === 'TERMINEE' || statut === 'ANNULEE') return false;
    
    const now = new Date();
    const interventionDate = new Date(date);
    const daysDifference = (now - interventionDate) / (1000 * 60 * 60 * 24);
    
    // Consider overdue if more than 7 days for normal, 3 days for urgent
    const overdueThreshold = isUrgent() ? 3 : 7;
    return daysDifference > overdueThreshold;
  };
  
  const getPriorityLevel = () => {
    const priority = workflow?.intervention?.priorite || 'NORMALE';
    const priorityLevels = {
      'CRITIQUE': 4,
      'HAUTE': 3,
      'NORMALE': 2,
      'BASSE': 1
    };
    return priorityLevels[priority] || 2;
  };
  
  const getStatusColor = () => {
    const status = workflow?.intervention?.statut;
    const colors = {
      'PLANIFIEE': 'yellow',
      'EN_ATTENTE_PDR': 'orange',
      'EN_COURS': 'blue',
      'EN_PAUSE': 'gray',
      'TERMINEE': 'green',
      'ANNULEE': 'red',
      'ECHEC': 'red'
    };
    return colors[status] || 'gray';
  };
  
  const getPhaseProgress = () => {
    const phases = ['diagnostic', 'planification', 'execution', 'controleQualite'];
    return phases.map(phase => ({
      phase,
      completed: isPhaseCompleted(phase),
      current: getCurrentPhase().toLowerCase() === phase
    }));
  };
  
  return {
    // State checks
    canTransition,
    getCurrentPhase,
    getCompletionPercentage,
    getNextActions,
    isPhaseCompleted,
    isUrgent,
    isOverdue,
    getPriorityLevel,
    getStatusColor,
    getPhaseProgress,
    
    // Computed values
    currentPhase: getCurrentPhase(),
    completionPercentage: getCompletionPercentage(),
    nextActions: getNextActions(),
    urgent: isUrgent(),
    overdue: isOverdue(),
    priorityLevel: getPriorityLevel(),
    statusColor: getStatusColor(),
    phaseProgress: getPhaseProgress()
  };
};

// Hook for workflow form management
export const useWorkflowForm = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  const updateNestedField = (parentField, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: prev[parentField]?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };
  
  const addArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };
  
  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };
  
  const validateForm = (validationFn) => {
    const validation = validationFn(formData);
    setErrors(validation.errors.reduce((acc, error) => {
      acc[error.field || 'general'] = error.message || error;
      return acc;
    }, {}));
    return validation.isValid;
  };
  
  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  };
  
  const touchField = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };
  
  return {
    formData,
    errors,
    touched,
    updateField,
    updateNestedField,
    addArrayItem,
    removeArrayItem,
    validateForm,
    resetForm,
    touchField,
    hasErrors: Object.keys(errors).length > 0,
    isFieldTouched: (field) => touched[field] || false,
    getFieldError: (field) => errors[field] || null
  };
};

export default {
  useInterventionWorkflow,
  useTransitionStatus,
  useUpdateDiagnostic,
  useUpdatePlanification,
  useAddControleQualite,
  useWorkflowDashboard,
  useWorkflowTimeline,
  useWorkflowTemplates,
  useWorkflowStatistics,
  useWorkflowState,
  useWorkflowForm
};