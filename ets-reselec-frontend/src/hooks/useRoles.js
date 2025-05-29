// src/hooks/useRoles.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';

// Get all roles with pagination and filters
export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 300000 // 5 minutes
  });
};

// Get role by ID
export const useRoleById = (id) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

// Create new role
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['permissions']);
      toast.success('Rôle créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du rôle';
      toast.error(message);
    }
  });
};

// Update role
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['role', variables.id]);
      queryClient.invalidateQueries(['permissions']);
      toast.success('Rôle modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du rôle';
      toast.error(message);
    }
  });
};

// Delete role
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['users']);
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du rôle';
      toast.error(message);
    }
  });
};

// Get permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions().then(res => res.data.data),
    staleTime: 600000 // 10 minutes - permissions don't change often
  });
};

// Assign role to user
export const useAssignRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }) => roleService.assignToUser(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle assigné avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'assignation du rôle';
      toast.error(message);
    }
  });
};