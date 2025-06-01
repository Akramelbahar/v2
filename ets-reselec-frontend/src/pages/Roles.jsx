import React, { useState } from 'react';
import { 
  Shield, Plus, Search, Edit, Trash2, Eye, 
  AlertCircle, Settings, Users, Lock, Key,
  Filter, RefreshCw, Download, Upload, MoreVertical, Check, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FormField from '../components/forms/FormField';

// Import hooks for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { truncateText } from '../utils/formatUtils';
import toast from 'react-hot-toast';

const Roles = () => {
  const { user: currentUser, hasPermission, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Simple data fetching functions
  const fetchRoles = async (params) => {
    const response = await api.get('/roles', { params });
    return response.data;
  };

  const fetchPermissions = async () => {
    const response = await api.get('/roles/permissions/all');
    return response.data.data || response.data;
  };

  // Data queries using React Query directly
  const { 
    data: rolesResponse, 
    isLoading: rolesLoading, 
    error: rolesError,
    refetch: refetchRoles 
  } = useQuery({
    queryKey: ['roles', { page: currentPage, limit: pageSize, search: searchQuery }],
    queryFn: () => fetchRoles({ page: currentPage, limit: pageSize, search: searchQuery }),
    keepPreviousData: true
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    staleTime: 600000
  });

  // Get roles data from response
  const rolesData = rolesResponse?.data || [];
  const totalRoles = rolesResponse?.pagination?.total || 0;
  const totalPages = rolesResponse?.pagination?.pages || 1;

  // Extract permissions and grouped permissions
  const allPermissions = permissionsData?.permissions || [];
  const groupedPermissions = permissionsData?.groupedPermissions || {};

  // Mutations
  const queryClient = useQueryClient();
  
  const createRoleMutation = useMutation({
    mutationFn: (roleData) => api.post('/roles', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle créé avec succès');
      closeModal();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du rôle';
      toast.error(message);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle modifié avec succès');
      closeModal();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification du rôle';
      toast.error(message);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression du rôle';
      toast.error(message);
    }
  });

  // Handlers
  const openModal = (type, role = null) => {
    setModalType(type);
    setSelectedRole(role);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setModalType('');
  };

  const openDeleteDialog = (role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      setShowDeleteDialog(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Role Form Component
  const RoleForm = ({ role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: role?.nom || '',
      permissions: role?.permissions?.map(p => p.id) || []
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};

      if (!formData.nom.trim()) {
        newErrors.nom = 'Le nom du rôle est requis';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        onSubmit(formData);
      }
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handlePermissionToggle = (permissionId) => {
      const currentPermissions = formData.permissions || [];
      const newPermissions = currentPermissions.includes(permissionId)
        ? currentPermissions.filter(id => id !== permissionId)
        : [...currentPermissions, permissionId];
      
      handleChange('permissions', newPermissions);
    };

    const handleModuleToggle = (modulePermissions) => {
      const currentPermissions = formData.permissions || [];
      const modulePermissionIds = modulePermissions.map(p => p.id);
      const allSelected = modulePermissionIds.every(id => currentPermissions.includes(id));
      
      let newPermissions;
      if (allSelected) {
        // Deselect all permissions in this module
        newPermissions = currentPermissions.filter(id => !modulePermissionIds.includes(id));
      } else {
        // Select all permissions in this module
        newPermissions = [...new Set([...currentPermissions, ...modulePermissionIds])];
      }
      
      handleChange('permissions', newPermissions);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Name */}
        <FormField
          label="Nom du rôle"
          name="nom"
          required
          error={errors.nom}
        >
          <input
            type="text"
            className="form-input"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            placeholder="Nom du rôle"
          />
        </FormField>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Permissions
          </label>
          
          <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
              const modulePermissionIds = modulePermissions.map(p => p.id);
              const selectedCount = modulePermissionIds.filter(id => 
                formData.permissions.includes(id)
              ).length;
              const allSelected = selectedCount === modulePermissionIds.length;
              const someSelected = selectedCount > 0 && selectedCount < modulePermissionIds.length;

              return (
                <div key={module} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleModuleToggle(modulePermissions)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          allSelected 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : someSelected
                            ? 'bg-blue-200 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {allSelected && <Check className="w-3 h-3" />}
                        {someSelected && !allSelected && <div className="w-2 h-2 bg-blue-600 rounded"></div>}
                      </button>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {module}
                      </h4>
                      <span className="text-sm text-gray-500">
                        ({selectedCount}/{modulePermissionIds.length})
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                    {modulePermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                          {permission.description || `${permission.action} ${permission.module}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            {formData.permissions.length} permission(s) sélectionnée(s)
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{role ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // Role Detail Modal
  const RoleDetailModal = ({ role }) => {
    if (!role) return null;

    return (
      <div className="space-y-6">
        {/* Role Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{role.nom}</h3>
              <p className="text-purple-100">
                {role.permissions?.length || 0} permission(s)
              </p>
              <p className="text-purple-200 text-sm">
                {role.userCount || 0} utilisateur(s) assigné(s)
              </p>
            </div>
          </div>
        </div>

        {/* Role Permissions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Permissions accordées</h4>
          
          {role.permissions && role.permissions.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
                role.permissions.reduce((acc, permission) => {
                  if (!acc[permission.module]) {
                    acc[permission.module] = [];
                  }
                  acc[permission.module].push(permission);
                  return acc;
                }, {})
              ).map(([module, modulePermissions]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 capitalize">
                    {module} ({modulePermissions.length})
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {modulePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          {permission.description || `${permission.action} ${permission.module}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucune permission accordée à ce rôle
            </p>
          )}
        </div>

        {/* Role Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Informations du rôle</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Créé le</label>
              <p className="text-gray-900">{formatDateTime(role.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Dernière modification</label>
              <p className="text-gray-900">{formatDateTime(role.updatedAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Utilisateurs</label>
              <p className="text-gray-900">{role.userCount || 0} assigné(s)</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {(hasPermission('roles:update') || isAdmin()) && (
            <button 
              onClick={() => {
                closeModal();
                openModal('role', role);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
          
          {(hasPermission('roles:delete') || isAdmin()) && role.nom !== 'Administrateur' && (
            <button 
              onClick={() => {
                closeModal();
                openDeleteDialog(role);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'nom',
      header: 'Nom du rôle',
      render: (value, role) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {role.permissions?.length || 0} permission(s)
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'userCount',
      header: 'Utilisateurs',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Users className="w-3 h-3 mr-1" />
          {value || 0}
        </span>
      )
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value?.length || 0} permission(s)
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      render: (value) => formatDate(value)
    }
  ];

  // Table actions
  const actions = (hasPermission('roles:read') || isAdmin()) ? [
    {
      icon: Eye,
      label: 'Voir',
      onClick: (role) => openModal('role-detail', role),
      className: 'text-blue-600 hover:text-blue-800'
    },
    ...((hasPermission('roles:update') || isAdmin()) ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (role) => openModal('role', role),
      className: 'text-yellow-600 hover:text-yellow-800'
    }] : []),
    ...((hasPermission('roles:delete') || isAdmin()) ? [{
      icon: Trash2,
      label: 'Supprimer',
      onClick: (role) => openDeleteDialog(role),
      className: 'text-red-600 hover:text-red-800',
      disabled: (role) => role.nom === 'Administrateur' // Can't delete admin role
    }] : [])
  ] : null;

  // Render modal content
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      role: {
        title: selectedRole ? 'Modifier le rôle' : 'Nouveau rôle',
        size: 'xl',
        content: (
          <RoleForm
            role={selectedRole}
            onSubmit={(data) => {
              if (selectedRole) {
                updateRoleMutation.mutate({ id: selectedRole.id, data });
              } else {
                createRoleMutation.mutate(data);
              }
            }}
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        )
      },
      'role-detail': {
        title: 'Détails du rôle',
        size: 'xl',
        content: <RoleDetailModal role={selectedRole} />
      }
    };

    const config = modalConfigs[modalType];
    if (!config) return null;

    return (
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={config.title}
        size={config.size}
      >
        {config.content}
      </Modal>
    );
  };

  // Error state
  if (rolesError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">
            Impossible de charger la liste des rôles
          </p>
          <button
            onClick={() => refetchRoles()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span>Gestion des Rôles</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les rôles et leurs permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => refetchRoles()}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
            {(hasPermission('roles:create') || isAdmin()) && (
              <button 
                onClick={() => openModal('role')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau rôle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Rechercher par nom de rôle..."
          />
        </div>
      </div>

      {/* Roles Table */}
      <DataTable
        data={rolesData || []}
        columns={columns}
        loading={rolesLoading}
        actions={actions}
        emptyMessage="Aucun rôle trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRoles}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        }
      />

      {/* Render Modal */}
      {renderModal()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteRoleMutation.isPending}
      />
    </div>
  );
};

export default Roles;