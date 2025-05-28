import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Shield, Key, Save, X, AlertCircle, CheckCircle, 
  Users, Lock, Unlock
} from 'lucide-react';
import { useCreateRole, useUpdateRole } from '../hooks/useRoles';
import FormField from '../components/forms/FormField';
import Modal from '../components/common/Modal';
import { ButtonSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const RoleForm = ({ 
  isOpen, 
  onClose, 
  role = null, 
  permissions = [],
  onSuccess 
}) => {
  const isEditing = !!role;
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // API hooks
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    clearErrors
  } = useForm({
    defaultValues: {
      nom: '',
      description: ''
    }
  });

  // Group permissions by module
  const groupedPermissions = React.useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  // Reset form when role changes
  useEffect(() => {
    if (role) {
      reset({
        nom: role.nom || '',
        description: role.description || ''
      });
      // Set selected permissions
      setSelectedPermissions(
        role.permissions?.map(p => p.id) || []
      );
    } else {
      reset({
        nom: '',
        description: ''
      });
      setSelectedPermissions([]);
    }
  }, [role, reset]);

  // Permission handlers
  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleModuleToggle = (modulePermissions) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => 
      selectedPermissions.includes(id)
    );

    if (allSelected) {
      // Remove all module permissions
      setSelectedPermissions(prev => 
        prev.filter(id => !modulePermissionIds.includes(id))
      );
    } else {
      // Add all module permissions
      setSelectedPermissions(prev => [
        ...prev,
        ...modulePermissionIds.filter(id => !prev.includes(id))
      ]);
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(permissions.map(p => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      const roleData = {
        ...data,
        permissionIds: selectedPermissions
      };

      let result;
      if (isEditing) {
        result = await updateRoleMutation.mutateAsync({
          id: role.id,
          data: roleData
        });
      } else {
        result = await createRoleMutation.mutateAsync(roleData);
      }

      // Success handling
      toast.success(
        isEditing 
          ? `Rôle "${data.nom}" modifié avec succès` 
          : `Rôle "${data.nom}" créé avec succès`
      );
      
      onSuccess?.(result);
      onClose();
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle validation errors
      if (error.response?.data?.details) {
        error.response.data.details.forEach(detail => {
          if (detail.path) {
            setError(detail.path, {
              type: 'server',
              message: detail.msg || detail.message
            });
          }
        });
      }
      
      toast.error(
        error.response?.data?.message || 
        `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du rôle`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>{isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}</span>
        </div>
      }
      size="2xl"
      closeOnOverlayClick={!isDirty}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Informations du rôle</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <FormField
              label="Nom du rôle"
              name="nom"
              required
              error={errors.nom?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.nom ? 'error' : ''}`}
                placeholder="Ex: Technicien, Superviseur, Manager..."
                {...register('nom', {
                  required: 'Le nom du rôle est requis',
                  minLength: {
                    value: 2,
                    message: 'Le nom doit contenir au moins 2 caractères'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Le nom ne peut pas dépasser 100 caractères'
                  },
                  validate: value => {
                    if (value.toLowerCase() === 'admin' || value.toLowerCase() === 'administrateur') {
                      return 'Ce nom de rôle est réservé';
                    }
                    return true;
                  }
                })}
              />
            </FormField>

            <FormField
              label="Description"
              name="description"
              error={errors.description?.message}
              help="Description optionnelle du rôle et de ses responsabilités"
            >
              <textarea
                rows={3}
                className={`form-input w-full ${errors.description ? 'error' : ''}`}
                placeholder="Décrivez les responsabilités et le périmètre de ce rôle..."
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'La description ne peut pas dépasser 500 caractères'
                  }
                })}
              />
            </FormField>
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Permissions</span>
              <span className="text-sm font-normal text-gray-600">
                ({selectedPermissions.length}/{permissions.length} sélectionnées)
              </span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Permission Groups */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
              const modulePermissionIds = modulePermissions.map(p => p.id);
              const selectedCount = modulePermissionIds.filter(id => 
                selectedPermissions.includes(id)
              ).length;
              const allSelected = selectedCount === modulePermissionIds.length;
              const someSelected = selectedCount > 0 && selectedCount < modulePermissionIds.length;

              return (
                <div key={module} className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleModuleToggle(modulePermissions)}
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            allSelected 
                              ? 'bg-blue-600 border-blue-600' 
                              : someSelected
                              ? 'bg-blue-200 border-blue-400'
                              : 'border-gray-300'
                          }`}
                        >
                          {allSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          {someSelected && !allSelected && (
                            <div className="w-2 h-2 bg-blue-600 rounded"></div>
                          )}
                        </button>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {module}
                        </h4>
                        <span className="text-sm text-gray-500">
                          ({selectedCount}/{modulePermissions.length})
                        </span>
                      </div>
                      
                      {allSelected ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : someSelected ? (
                        <Key className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {modulePermissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.id);
                        
                        return (
                          <div
                            key={permission.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handlePermissionToggle(permission.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">
                                  {permission.action}
                                </div>
                                {permission.description && (
                                  <div className="text-sm text-gray-600 truncate">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPermissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune permission sélectionnée</p>
              <p className="text-sm">Ce rôle n'aura aucun accès au système</p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || (!isDirty && isEditing)}
            className={`btn btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <ButtonSpinner size="small" />
                <span className="ml-2">
                  {isEditing ? 'Modification...' : 'Création...'}
                </span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span>{isEditing ? 'Modifier' : 'Créer'}</span>
              </>
            )}
          </button>
        </div>

        {/* Form Status */}
        {isDirty && (
          <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Vous avez des modifications non sauvegardées</span>
          </div>
        )}

        {/* Selected Permissions Summary */}
        {selectedPermissions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">
              Résumé des permissions sélectionnées
            </h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                const moduleSelectedCount = modulePermissions.filter(p => 
                  selectedPermissions.includes(p.id)
                ).length;
                
                if (moduleSelectedCount === 0) return null;
                
                return (
                  <span
                    key={module}
                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {module}: {moduleSelectedCount}/{modulePermissions.length}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RoleForm;