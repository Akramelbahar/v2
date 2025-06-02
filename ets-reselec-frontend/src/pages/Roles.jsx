import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Eye, Save, X, AlertCircle, CheckCircle, Key, Users } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useRolePermissions,
  useUpdateRolePermissions
} from '../hooks/useRoles';
import {
  usePermissions,
  useAssignPermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission
} from '../hooks/usePermissions';
import toast from 'react-hot-toast';

const Roles = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Queries
  const { data: rolesData, isLoading: rolesLoading } = useRoles({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    includePermissions: true
  });

  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({
    limit: 100 // Get all permissions
  });

  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useRolePermissions(
    selectedItem?.id
  );

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updateRolePermissionsMutation = useUpdateRolePermissions();
  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();

  // Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    
    if (type === 'role-permissions' && item) {
      // Load current permissions for the role
      const currentPermissions = item.permissions?.map(p => p.id) || [];
      setSelectedPermissions(currentPermissions);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('');
    setSelectedPermissions([]);
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
      } else if (activeTab === 'permissions') {
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Forms
  const RoleForm = ({ role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: role?.nom || '',
      permissions: role?.permissions?.map(p => p.id) || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePermission = (permissionId) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(id => id !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {permissionsData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              {Object.entries(permissionsData.grouped || {}).map(([module, permissions]) => (
                <div key={module} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{module}</h4>
                  <div className="space-y-2 ml-4">
                    {permissions.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span className="text-sm text-gray-700">
                          {permission.action} - {permission.description || 'Aucune description'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            placeholder="Description de la permission..."
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

  const RolePermissionsManager = ({ role }) => {
    const [localPermissions, setLocalPermissions] = useState(
      selectedPermissions || role.permissions?.map(p => p.id) || []
    );
    const [hasChanges, setHasChanges] = useState(false);

    const togglePermission = (permissionId) => {
      setLocalPermissions(prev => {
        const newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];
        
        setHasChanges(true);
        return newPermissions;
      });
    };

    const handleSave = async () => {
      try {
        await updateRolePermissionsMutation.mutateAsync({
          id: role.id,
          permissions: localPermissions
        });
        closeModal();
      } catch (error) {
        console.error('Error updating permissions:', error);
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Rôle: {role.nom}</h4>
          <p className="text-sm text-gray-600">
            Sélectionnez les permissions à attribuer à ce rôle
          </p>
        </div>

        <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
          {permissionsLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            Object.entries(permissionsData?.grouped || {}).map(([module, permissions]) => (
              <div key={module} className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 capitalize flex items-center space-x-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span>{module}</span>
                </h4>
                <div className="space-y-2 ml-6">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={localPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">{permission.action}</span>
                        {permission.description && (
                          <span className="text-gray-500"> - {permission.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
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
            onClick={handleSave}
            disabled={!hasChanges || updateRolePermissionsMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {updateRolePermissionsMutation.isPending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    );
  };

  // Tab content renderers
  const renderRoles = () => {
    const { data, total } = rolesData || { data: [], total: 0 };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Rôles</h2>
            <button
              onClick={() => openModal('role')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Rôle</span>
            </button>
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
          data={data}
          loading={rolesLoading}
          columns={[
            { key: 'nom', header: 'Nom du Rôle' },
            {
              key: 'userCount',
              header: 'Utilisateurs',
              render: (value) => (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{value || 0}</span>
                </div>
              )
            },
            {
              key: 'permissions',
              header: 'Permissions',
              render: (value) => (
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span>{value?.length || 0} permissions</span>
                </div>
              )
            }
          ]}
          actions={[
            {
              icon: Eye,
              label: 'Voir',
              onClick: (row) => openModal('role-detail', row),
              className: 'text-blue-600 hover:text-blue-800'
            },
            {
              icon: Key,
              label: 'Gérer les permissions',
              onClick: (row) => openModal('role-permissions', row),
              className: 'text-green-600 hover:text-green-800'
            },
            {
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('role', row),
              className: 'text-yellow-600 hover:text-yellow-800',
              disabled: (row) => ['Administrateur'].includes(row.nom)
            },
            {
              icon: Trash2,
              label: 'Supprimer',
              onClick: (row) => openDeleteDialog(row),
              className: 'text-red-600 hover:text-red-800',
              disabled: (row) => ['Administrateur', 'Chef de Section', 'Technicien Senior', 'Technicien Junior', 'Observateur'].includes(row.nom)
            }
          ]}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / pageSize)}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          }
        />
      </div>
    );
  };

  const renderPermissions = () => {
    const { permissions = [], grouped = {} } = permissionsData || {};

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Permissions</h2>
            <button
              onClick={() => openModal('permission')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Permission</span>
            </button>
          </div>
        </div>

        {permissionsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([module, modulePermissions]) => (
              <div key={module} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold capitalize flex items-center space-x-2">
                    <Key className="w-5 h-5 text-gray-600" />
                    <span>Module: {module}</span>
                  </h3>
                </div>
                <div className="p-4">
                  <DataTable
                    data={modulePermissions}
                    columns={[
                      { key: 'action', header: 'Action' },
                      { key: 'description', header: 'Description' },
                      {
                        key: 'roles',
                        header: 'Rôles',
                        render: (value) => value?.length || 0
                      }
                    ]}
                    actions={[
                      {
                        icon: Edit,
                        label: 'Modifier',
                        onClick: (row) => openModal('permission', row),
                        className: 'text-yellow-600 hover:text-yellow-800'
                      },
                      {
                        icon: Trash2,
                        label: 'Supprimer',
                        onClick: (row) => openDeleteDialog(row),
                        className: 'text-red-600 hover:text-red-800'
                      }
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Modal renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      role: {
        title: selectedItem ? 'Modifier le Rôle' : 'Nouveau Rôle',
        size: 'lg',
        content: (
          <RoleForm
            role={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                updateRoleMutation.mutate({ id: selectedItem.id, data });
              } else {
                createRoleMutation.mutate(data);
              }
            }}
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        )
      },
      'role-permissions': {
        title: 'Gérer les Permissions',
        size: 'lg',
        content: <RolePermissionsManager role={selectedItem} />
      },
      'role-detail': {
        title: 'Détails du Rôle',
        size: 'lg',
        content: (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-2">{selectedItem?.nom}</h4>
              <p className="text-sm text-gray-600">
                {selectedItem?.userCount || 0} utilisateur(s) avec ce rôle
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Permissions ({selectedItem?.permissions?.length || 0})</h4>
              <div className="space-y-2">
                {selectedItem?.permissions?.map(permission => (
                  <div key={permission.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <span className="font-medium">{permission.module}:</span> {permission.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                updatePermissionMutation.mutate({ id: selectedItem.id, data });
              } else {
                createPermissionMutation.mutate(data);
              }
            }}
            loading={createPermissionMutation.isPending || updatePermissionMutation.isPending}
          />
        )
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

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Accès Restreint</h2>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles et Permissions</h1>
        <p className="text-gray-600 mt-1">Configurez les rôles et leurs permissions</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'roles', label: 'Rôles', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Key }
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