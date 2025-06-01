// ets-reselec-frontend/src/hooks/useRoles.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import toast from 'react-hot-toast';

export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params).then(res => {
      // Handle both paginated and non-paginated responses
      if (res.data.pagination) {
        return {
          data: res.data.data,
          total: res.data.pagination.total,
          page: res.data.pagination.page,
          pages: res.data.pagination.pages
        };
      }
      // If it's just an array, wrap it
      return {
        data: Array.isArray(res.data.data) ? res.data.data : res.data,
        total: Array.isArray(res.data.data) ? res.data.data.length : (Array.isArray(res.data) ? res.data.length : 0)
      };
    }),
    keepPreviousData: true,
    staleTime: 300000 // 5 minutes
  });
};

export const useRole = (id) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleService.getById(id).then(res => res.data.data),
    enabled: !!id,
    staleTime: 300000
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

export const useAssignPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, permissions }) => roleService.assignPermissions(id, permissions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['roles']);
      queryClient.invalidateQueries(['role', variables.id]);
      toast.success('Permissions assignées avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'assignation des permissions';
      toast.error(message);
    }
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getAllPermissions().then(res => {
      const data = res.data.data;
      return data;
    }),
    staleTime: 600000 // 10 minutes - permissions don't change often
  });
};

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

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => roleService.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']);
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
    mutationFn: roleService.deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      queryClient.invalidateQueries(['roles']);
      toast.success('Permission supprimée avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de la permission';
      toast.error(message);
    }
  });
};