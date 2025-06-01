// src/hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';

// User hooks
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 300000
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      toast.success('Utilisateur modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur';
      toast.error(message);
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
      toast.error(message);
    }
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, roleId }) => userService.updateRole(id, roleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      toast.success('Rôle de l\'utilisateur mis à jour');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour du rôle';
      toast.error(message);
    }
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: userService.resetPassword,
    onSuccess: () => {
      toast.success('Un nouveau mot de passe a été envoyé à l\'utilisateur');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe';
      toast.error(message);
    }
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, enabled }) => userService.toggleStatus(id, enabled),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      toast.success(variables.enabled ? 'Utilisateur activé' : 'Utilisateur désactivé');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(message);
    }
  });
};

// Role hooks
export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll().then(res => res.data.data || res.data),
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

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getAllPermissions().then(res => res.data.data || res.data),
    staleTime: 3600000 // 1 hour - permissions rarely change
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

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }) => roleService.updatePermissions(roleId, permissionIds),
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