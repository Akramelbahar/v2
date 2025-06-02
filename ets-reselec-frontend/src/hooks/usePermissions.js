// src/hooks/usePermissions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionService } from '../services/permissionService';
import toast from 'react-hot-toast';

export const usePermissions = (params = {}) => {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: () => permissionService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 600000 // 10 minutes - permissions don't change often
  });
};

export const usePermission = (id) => {
  return useQuery({
    queryKey: ['permission', id],
    queryFn: () => permissionService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: permissionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']); // Also refresh roles as they include permissions
      toast.success('Permission créée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de la permission';
      toast.error(message);
    }
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => permissionService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['permission', variables.id]);
      queryClient.invalidateQueries(['roles']); // Also refresh roles
      toast.success('Permission modifiée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de la permission';
      toast.error(message);
    }
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: permissionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']); // Also refresh roles
      toast.success('Permission supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de la permission';
      toast.error(message);
    }
  });
};

export const usePermissionModules = () => {
  return useQuery({
    queryKey: ['permission-modules'],
    queryFn: () => permissionService.getModules().then(res => res.data.data),
    staleTime: 3600000 // 1 hour - modules don't change often
  });
};

// This is a placeholder for role permission assignment
// It's actually handled by the useUpdateRolePermissions in useRoles.js
export const useAssignPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissions }) => {
      // This would typically call a specific endpoint
      // For now, it's handled by the role update endpoint
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['permissions']);
      toast.success('Permissions assignées avec succès');
    }
  });
};