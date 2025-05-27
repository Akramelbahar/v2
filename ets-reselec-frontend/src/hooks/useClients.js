// src/hooks/useClients.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import toast from 'react-hot-toast';

export const useClients = (params = {}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 300000 // 5 minutes
  });
};

export const useClient = (id) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Client créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du client';
      toast.error(message);
    }
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => clientService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client', variables.id]);
      toast.success('Client modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du client';
      toast.error(message);
    }
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du client';
      toast.error(message);
    }
  });
};

export const useClientSectors = () => {
  return useQuery({
    queryKey: ['client-sectors'],
    queryFn: () => clientService.getSectors().then(res => res.data.data),
    staleTime: 600000 // 10 minutes - sectors don't change often
  });
};