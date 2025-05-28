// ets-reselec-frontend/src/hooks/useClients.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import toast from 'react-hot-toast';

export const useClients = (params = {}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientService.getAll(params).then(res => {
      // Handle the backend response format properly
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
    staleTime: 300000 // 5 minutes
  });
};

export const useClient = (id) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error('Failed to fetch client');
    }),
    enabled: !!id,
    staleTime: 300000
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['dashboard-stats']);
      if (response.data.success) {
        toast.success(response.data.message || 'Client créé avec succès');
      }
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
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client', variables.id]);
      if (response.data.success) {
        toast.success(response.data.message || 'Client modifié avec succès');
      }
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
    onSuccess: (response) => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['dashboard-stats']);
      if (response.data.success) {
        toast.success(response.data.message || 'Client supprimé avec succès');
      }
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
    queryFn: () => clientService.getSectors().then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return [];
    }),
    staleTime: 600000 // 10 minutes - sectors don't change often
  });
};