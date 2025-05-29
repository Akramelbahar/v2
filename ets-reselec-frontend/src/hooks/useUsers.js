// src/hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

// Get all users with pagination and filters
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params).then(res => res.data.data || res.data),
    keepPreviousData: true,
    staleTime: 300000 // 5 minutes
  });
};

// Get user by ID
export const useUserById = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
  });
};

// Create new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['dashboard-stats']);
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
    mutationFn: ({ id, data, isPasswordReset = false }) => {
      if (isPasswordReset) {
        return userService.resetPassword(id, data);
      }
      return userService.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      
      if (variables.isPasswordReset) {
        toast.success('Mot de passe réinitialisé avec succès');
      } else {
        toast.success('Utilisateur modifié avec succès');
      }
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
      queryClient.invalidateQueries(['dashboard-stats']);
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
      toast.error(message);
    }
  });
};

// Toggle user status (activate/deactivate)
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => userService.toggleStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['user', variables.id]);
      toast.success(`Utilisateur ${variables.status ? 'activé' : 'désactivé'} avec succès`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du statut';
      toast.error(message);
    }
  });
};

// Get user statistics
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userService.getStats().then(res => res.data.data),
    staleTime: 600000 // 10 minutes
  });
};