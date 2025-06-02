import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';

export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 600000 // 10 minutes - roles don't change often
  });
};

export const useRole = (id) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du rôle';
      toast.error(message);
    }
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['role', variables.id]);
      toast.success('Rôle modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du rôle';
      toast.error(message);
    }
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du rôle';
      toast.error(message);
    }
  });
};

export const useRolePermissions = (id) => {
  return useQuery({
    queryKey: ['role-permissions', id],
    queryFn: () => roleService.getPermissions(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, permissions }) => roleService.updatePermissions(id, permissions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['role', variables.id]);
      queryClient.invalidateQueries(['role-permissions', variables.id]);
      toast.success('Permissions mises à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour des permissions';
      toast.error(message);
    }
  });
};
