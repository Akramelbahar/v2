// ets-reselec-frontend/src/pages/Roles.jsx
import React, { useState } from 'react';
import { 
  Shield, Plus, Edit, Trash2, Eye, Users, Settings, 
  Search, Filter, Check, X, AlertCircle, Save, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Import custom hooks
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission
} from '../hooks/useRoles';

const Roles = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const rolesQuery = useRoles({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery 
  });
  
  const permissionsQuery = usePermissions();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissions();
  
  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();

  // Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('');
    // Refetch data after modal close
    if (modalType === 'role') {
      createRoleMutation.reset();
      updateRoleMutation.reset();
    } else if (modalType === 'permission') {
      createPermissionMutation.reset();
      updatePermissionMutation.reset();
    }
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      if (activeTab === 'roles') {
        await deleteRoleMutation.mutateAsync(selectedItem.id);
      } else {
        await deletePermissionMutation.mutateAsync(selectedItem.id);
      }
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Role Form Component
  const RoleForm = ({ role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: role?.nom || '',
      permissions: role?.permissions?.map(p => p.id) || []
    });

    const [expandedModules, setExpandedModules] = useState({});

    const { data: permissionsData, isLoading: permissionsLoading } = permissionsQuery;

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePermissionToggle = (permissionId) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(id => id !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    };

    const toggleModule = (module) => {
      setExpandedModules(prev => ({
        ...prev,
        [module]: !prev[module]
      }));
    };

    const selectAllModule = (module, permissions) => {
      const modulePermissionIds = permissions.map(p => p.id);
      const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));
      
      setFormData(prev => ({
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter(id => !modulePermissionIds.includes(id))
          : [...new Set([...prev.permissions, ...modulePermissionIds])]
      }));
    };

    if (permissionsLoading || !permissionsData) {
      return <LoadingSpinner text="Chargement des permissions..." />;
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du rôle *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            placeholder="Ex: Technicien Senior"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions
          </label>
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {permissionsData?.groupedPermissions && Object.entries(permissionsData.groupedPermissions).map(([module, permissions]) => {
              const modulePermissionIds = permissions.map(p => p.id);
              const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));
              const someSelected = modulePermissionIds.some(id => formData.permissions.includes(id));
              
              return (
                <div key={module} className="border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                       onClick={() => toggleModule(module)}>
                    <div className="flex items-center space-x-3">
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${expandedModules[module] ? 'rotate-180' : ''}`} 
                      />
                      <span className="font-medium text-gray-900 capitalize">
                        {module.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({permissions.length} permissions)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => selectAllModule(module, permissions)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">
                        Tout sélectionner
                      </span>
                    </div>
                  </div>
                  
                  {expandedModules[module] && (
                    <div className="p-3 space-y-2">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {permission.action.replace('_', ' ')}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {formData.permissions.length} permission(s) sélectionnée(s)
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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

  // Permission Form Component
  const PermissionForm = ({ permission, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      module: permission?.module || '',
      action: permission?.action || '',
      description: permission?.description || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.module}
            onChange={(e) => handleChange('module', e.target.value)}
            placeholder="Ex: clients, equipment, interventions"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.action}
            onChange={(e) => handleChange('action', e.target.value)}
            placeholder="Ex: create, read, update, delete"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez ce que permet cette permission..."
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{permission ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // Role Detail Modal
  const RoleDetailModal = ({ role }) => {
    if (!role) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Informations du Rôle</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Nom:</p>
              <p className="text-sm text-gray-900">{role.nom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Utilisateurs:</p>
              <p className="text-sm text-gray-900">{role.userCount || 0} utilisateur(s)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-lg">Permissions ({role.permissions?.length || 0})</h4>
          </div>
          <div className="p-4">
            {role.permissions?.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(
                  role.permissions.reduce((acc, perm) => {
                    if (!acc[perm.module]) acc[perm.module] = [];
                    acc[perm.module].push(perm);
                    return acc;
                  }, {})
                ).map(([module, permissions]) => (
                  <div key={module} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="font-medium text-gray-900 mb-2 capitalize">
                      {module.replace('_', ' ')}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(perm => (
                        <span
                          key={perm.id}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {perm.action.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune permission assignée</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Tabs content renderers
  const renderRoles = () => {
    const { data: rolesData, isLoading, error } = rolesQuery;
    
    // Debug logging
    console.log('Roles Query Data:', rolesData);
    console.log('Roles Query Loading:', isLoading);
    console.log('Roles Query Error:', error);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Rôles</h2>
            {hasPermission('roles:create') && (
              <button 
                onClick={() => openModal('role')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Rôle</span>
              </button>
            )}
          </div>
          
          <div className="mb-4">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher un rôle..."
            />
          </div>
        </div>

        <DataTable
          data={rolesData?.data || []}
          loading={isLoading}
          columns={[
            { key: 'nom', header: 'Nom du Rôle' },
            { 
              key: 'permissions', 
              header: 'Permissions',
              render: (value) => `${value?.length || 0} permission(s)`
            },
            { 
              key: 'userCount', 
              header: 'Utilisateurs',
              render: (value) => `${value || 0} utilisateur(s)`
            }
          ]}
          actions={hasPermission('roles:read') ? [
            {
              icon: Eye,
              label: 'Voir',
              onClick: (row) => openModal('role-detail', row),
              className: 'text-blue-600 hover:text-blue-800'
            },
            ...(hasPermission('roles:update') ? [{
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('role', row),
              className: 'text-yellow-600 hover:text-yellow-800'
            }] : []),
            ...(hasPermission('roles:delete') ? [{
              icon: Trash2,
              label: 'Supprimer',
              onClick: (row) => openDeleteDialog(row),
              className: 'text-red-600 hover:text-red-800',
              disabled: (row) => ['Administrateur', 'Admin'].includes(row.nom)
            }] : [])
          ] : null}
          pagination={rolesData?.pagination ? (
            <Pagination
              currentPage={rolesData.pagination.page || currentPage}
              totalPages={rolesData.pagination.pages || Math.ceil((rolesData?.total || 0) / pageSize)}
              totalItems={rolesData.pagination.total || rolesData?.total || 0}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          ) : null}
        />
      </div>
    );
  };

  const renderPermissions = () => {
    const { data: permissionsData, isLoading } = permissionsQuery;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Permissions</h2>
            {hasPermission('roles:create') && (
              <button 
                onClick={() => openModal('permission')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Permission</span>
              </button>
            )}
          </div>
        </div>

        <DataTable
          data={permissionsData?.permissions || []}
          loading={isLoading}
          columns={[
            { key: 'module', header: 'Module' },
            { key: 'action', header: 'Action' },
            { key: 'description', header: 'Description' }
          ]}
          actions={hasPermission('roles:read') ? [
            ...(hasPermission('roles:update') ? [{
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('permission', row),
              className: 'text-yellow-600 hover:text-yellow-800'
            }] : []),
            ...(hasPermission('roles:delete') ? [{
              icon: Trash2,
              label: 'Supprimer',
              onClick: (row) => openDeleteDialog(row),
              className: 'text-red-600 hover:text-red-800'
            }] : [])
          ] : null}
        />
      </div>
    );
  };

  // Modal renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      role: {
        title: selectedItem ? 'Modifier le Rôle' : 'Nouveau Rôle',
        size: 'xl',
        content: (
          <RoleForm
            role={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                updateRoleMutation.mutate({ id: selectedItem.id, data }, {
                  onSuccess: () => closeModal()
                });
              } else {
                createRoleMutation.mutate(data, {
                  onSuccess: () => closeModal()
                });
              }
            }}
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        )
      },
      permission: {
        title: selectedItem ? 'Modifier la Permission' : 'Nouvelle Permission',
        size: 'md',
        content: (
          <PermissionForm
            permission={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                updatePermissionMutation.mutate({ id: selectedItem.id, data }, {
                  onSuccess: () => closeModal()
                });
              } else {
                createPermissionMutation.mutate(data, {
                  onSuccess: () => closeModal()
                });
              }
            }}
            loading={createPermissionMutation.isPending || updatePermissionMutation.isPending}
          />
        )
      },
      'role-detail': {
        title: 'Détails du Rôle',
        size: 'lg',
        content: <RoleDetailModal role={selectedItem} />
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles et Permissions</h1>
            <p className="text-gray-600 mt-1">Configurez les rôles utilisateur et leurs permissions</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Connecté en tant que</p>
            <p className="font-medium">{user?.nom}</p>
            <p className="text-xs text-blue-600">{typeof user?.role === 'object' ? user.role?.nom : user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'roles', label: 'Rôles', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                    setSearchQuery('');
                  }}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'roles' && renderRoles()}
          {activeTab === 'permissions' && renderPermissions()}
        </div>
      </div>

      {/* Render Modal */}
      {renderModal()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${
          activeTab === 'roles' ? 'ce rôle' : 'cette permission'
        } ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteRoleMutation.isPending || deletePermissionMutation.isPending}
      />
    </div>
  );
};

export default Roles;