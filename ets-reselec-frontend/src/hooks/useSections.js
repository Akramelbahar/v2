// src/hooks/useSections.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';
import toast from 'react-hot-toast';

// Get all sections
export const useSections = (params = {}) => {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: () => sectionService.getAll(params).then(res => res.data.data || res.data),
    staleTime: 600000 // 10 minutes - sections don't change often
  });
};

// Get section by ID
export const useSectionById = (id) => {
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => sectionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
  });
};

// Create new section
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
      queryClient.invalidateQueries(['users']);
      toast.success('Section supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de la section';
      toast.error(message);
    }
  });
};