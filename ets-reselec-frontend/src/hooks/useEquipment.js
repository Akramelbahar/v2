// src/hooks/useEquipment.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipmentService';
import toast from 'react-hot-toast';

export const useEquipment = (params = {}) => {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: () => equipmentService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 300000
  });
};

export const useEquipmentById = (id) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Équipement créé avec succès');
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['equipment', variables.id]);
      toast.success('Équipement modifié avec succès');
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
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Équipement supprimé avec succès');
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
    queryFn: () => equipmentService.getTypes().then(res => res.data.data),
    staleTime: 3600000 // 1 hour - types don't change often
  });
};