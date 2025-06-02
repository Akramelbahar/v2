// src/hooks/useRoles.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';

// Get all roles
export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params).then(res => res.data),
    keepPreviousData: true,
    staleTime: 600000 // 10 minutes - roles don't change often
  });
};

// Get role by ID
export const useRole = (id) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000
  });
};

// Get all permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getAllPermissions().then(res => res.data.data),
    staleTime: 3600000 // 1 hour - permissions rarely change
  });
};

// Create role
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

// Update role
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

// Delete role
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

// Assign permissions to role
export const useAssignPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissions }) => 
      roleService.assignPermissionsToRole(roleId, permissions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['role', variables.roleId]);
      toast.success('Permissions mises à jour avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour des permissions';
      toast.error(message);
    }
  });
};

// Create permission
export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      toast.success('Permission créée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de la permission';
      toast.error(message);
    }
  });
};

// Update permission
export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => roleService.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']); // Roles might be affected
      toast.success('Permission modifiée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de la permission';
      toast.error(message);
    }
  });
};

// Delete permission
export const useDeletePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roleService.deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']); // Roles might be affected
      toast.success('Permission supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de la permission';
      toast.error(message);
    }
  });
};