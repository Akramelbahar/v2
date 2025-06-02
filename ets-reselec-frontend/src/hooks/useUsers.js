// src/hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

// Get all users
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params).then(res => res.data),
    keepPreviousData: true,
    staleTime: 300000 // 5 minutes
  });
};

// Get user by ID
export const useUser = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

// Get user permissions
export const useUserPermissions = (id) => {
  return useQuery({
    queryKey: ['user-permissions', id],
    queryFn: () => userService.getUserPermissions(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 600000 // 10 minutes
  });
};

// Create user
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

// Update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      queryClient.invalidateQueries(['user-permissions', variables.id]);
      toast.success('Utilisateur modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur';
      toast.error(message);
    }
  });
};

// Delete user
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

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, roleId }) => userService.updateRole(id, roleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      queryClient.invalidateQueries(['user-permissions', variables.id]);
      toast.success('Rôle de l\'utilisateur modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du rôle';
      toast.error(message);
    }
  });
};

// Reset user password
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: userService.resetPassword,
    onSuccess: (data) => {
      toast.success('Mot de passe réinitialisé avec succès');
      // If in development and temporary password is returned, show it
      if (data.data.data?.temporaryPassword) {
        toast.success(`Mot de passe temporaire: ${data.data.data.temporaryPassword}`, {
          duration: 10000 // Show for 10 seconds
        });
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe';
      toast.error(message);
    }
  });
};

// Toggle user status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, enabled }) => userService.updateStatus(id, enabled),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      const message = variables.enabled ? 'Utilisateur activé' : 'Utilisateur désactivé';
      toast.success(message);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du statut';
      toast.error(message);
    }
  });
};

// Get users by role
export const useUsersByRole = (roleId, params = {}) => {
  return useQuery({
    queryKey: ['users-by-role', roleId, params],
    queryFn: () => userService.getUsersByRole(roleId, params).then(res => res.data),
    enabled: !!roleId,
    keepPreviousData: true
  });
};

// Get users by section
export const useUsersBySection = (section, params = {}) => {
  return useQuery({
    queryKey: ['users-by-section', section, params],
    queryFn: () => userService.getUsersBySection(section, params).then(res => res.data),
    enabled: !!section,
    keepPreviousData: true
  });
};

// Get enabled/disabled users
export const useEnabledUsers = (enabled = true, params = {}) => {
  return useQuery({
    queryKey: ['enabled-users', enabled, params],
    queryFn: () => userService.getEnabledUsers(enabled, params).then(res => res.data),
    keepPreviousData: true
  });
};