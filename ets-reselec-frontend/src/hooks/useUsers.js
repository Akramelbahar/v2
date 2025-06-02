import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }) => userService.changePassword(id, newPassword),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error(message);
    }
  });
};