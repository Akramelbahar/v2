
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';
import toast from 'react-hot-toast';

export const useSections = (params = {}) => {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: () => sectionService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 600000
  });
};

export const useSection = (id) => {
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => sectionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
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

export const useSectionTypes = () => {
  return useQuery({
    queryKey: ['section-types'],
    queryFn: () => sectionService.getTypes().then(res => res.data.data),
    staleTime: 3600000 // 1 hour - types don't change often
  });
};