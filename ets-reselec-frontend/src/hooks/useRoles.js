// Export/Import hooks
export const useExportRoles = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: roleService.exportRoles,
      onError: (error) => {
        const message = error.response?.data?.message || 'Erreur lors de l\'export';
        toast.error(message);
        throw error;
      }
    });
  };
  
  export const useImportRoles = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: roleService.importRoles,
      onSuccess: () => {
        queryClient.invalidateQueries(roleQueryKeys.lists());
        queryClient.invalidateQueries(roleQueryKeys.statistics);
        
        toast.success('Rôles importés avec succès');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Erreur lors de l\'import';
        toast.error(message);
        throw error;
      }
    });
  };