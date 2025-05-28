// ets-reselec-frontend/src/hooks/useEquipment.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipmentService';
import toast from 'react-hot-toast';

export const useEquipment = (params = {}) => {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: () => equipmentService.getAll(params).then(res => {
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
    staleTime: 300000
  });
};

export const useEquipmentById = (id) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentService.getById(id).then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error('Failed to fetch equipment');
    }),
    enabled: !!id,
    staleTime: 300000
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: equipmentService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['dashboard-stats']);
      if (response.data.success) {
        toast.success(response.data.message || 'Équipement créé avec succès');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'équipement';
      toast.error(message);
    }
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => equipmentService.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['equipment', variables.id]);
      if (response.data.success) {
        toast.success(response.data.message || 'Équipement modifié avec succès');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'équipement';
      toast.error(message);
    }
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['dashboard-stats']);
      if (response.data.success) {
        toast.success(response.data.message || 'Équipement supprimé avec succès');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'équipement';
      toast.error(message);
    }
  });
};

export const useEquipmentTypes = () => {
  return useQuery({
    queryKey: ['equipment-types'],
    queryFn: () => equipmentService.getTypes().then(res => {
      if (res.data.success) {
        return res.data.data;
      }
      return [];
    }),
    staleTime: 3600000 // 1 hour - types don't change often
  });
};