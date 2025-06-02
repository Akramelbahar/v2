// src/hooks/useSections.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';
import toast from 'react-hot-toast';

// Get all sections
export const useSections = (params = {}) => {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: () => sectionService.getAll(params).then(res => res.data.data),
    staleTime: 300000 // 5 minutes
  });
};

// Get section by ID
export const useSection = (id) => {
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => sectionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

// Get section users
export const useSectionUsers = (id, params = {}) => {
  return useQuery({
    queryKey: ['section-users', id, params],
    queryFn: () => sectionService.getSectionUsers(id, params).then(res => res.data),
    enabled: !!id,
    keepPreviousData: true
  });
};

// Get section interventions
export const useSectionInterventions = (id, params = {}) => {
  return useQuery({
    queryKey: ['section-interventions', id, params],
    queryFn: () => sectionService.getSectionInterventions(id, params).then(res => res.data),
    enabled: !!id,
    keepPreviousData: true
  });
};

// Get section equipment
export const useSectionEquipment = (id, params = {}) => {
  return useQuery({
    queryKey: ['section-equipment', id, params],
    queryFn: () => sectionService.getSectionEquipment(id, params).then(res => res.data),
    enabled: !!id,
    keepPreviousData: true
  });
};

// Get section statistics
export const useSectionStatistics = (id) => {
  return useQuery({
    queryKey: ['section-statistics', id],
    queryFn: () => sectionService.getSectionStatistics(id).then(res => res.data.data),
    enabled: !!id,
    refetchInterval: 60000 // Refresh every minute
  });
};

// Create section
export const useCreateSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sectionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['sections']);
      toast.success('Section créée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de la section';
      toast.error(message);
    }
  });
};

// Update section
export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => sectionService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['sections']);
      queryClient.invalidateQueries(['section', variables.id]);
      queryClient.invalidateQueries(['section-statistics', variables.id]);
      toast.success('Section modifiée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de la section';
      toast.error(message);
    }
  });
};

// Delete section
export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sectionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['sections']);
      toast.success('Section supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de la section';
      toast.error(message);
    }
  });
};