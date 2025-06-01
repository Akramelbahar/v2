// hooks/useSections.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';
import toast from 'react-hot-toast';

export const useSections = (params = {}) => {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: () => sectionService.getAll(params).then(res => {
      // The API returns { success: true, data: [...], pagination: {...} }
      // We need to return the whole structure, not just res.data.data
      return res.data;
    }),
    keepPreviousData: true,
    staleTime: 300000
  });
};

export const useSection = (id) => {
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => sectionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

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

export const useAssignUsersToSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userIds }) => sectionService.assignUsers(id, userIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['sections']);
      queryClient.invalidateQueries(['section', variables.id]);
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateurs assignés avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'assignation des utilisateurs';
      toast.error(message);
    }
  });
};