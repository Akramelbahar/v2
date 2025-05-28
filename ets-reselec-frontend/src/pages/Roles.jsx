import React, { useState } from 'react';
import { 
  Shield, Plus, Search, Edit, Trash2, Eye, Users, Settings, 
  AlertCircle, CheckCircle, Lock, Key, UserCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

// Components
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';

// API functions
const roleAPI = {
  getAll: (params) => api.get('/admin/roles', { params }).then(res => res.data),
  getById: (id) => api.get(`/admin/roles/${id}`).then(res => res.data),
  create: (data) => api.post('/admin/roles', data).then(res => res.data),
  update: (id, data) => api.put(`/admin/roles/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/admin/roles/${id}`).then(res => res.data)
};

const permissionAPI = {
  getAll: () => api.get('/admin/permissions?groupBy=module').then(res => res.data),
  create: (data) => api.post('/admin/permissions', data).then(res => res.data),
  update: (id, data) => api.put(`/admin/permissions/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/admin/permissions/${id}`).then(res => res.data)
};

const Roles = () => {
  const queryClient = useQueryClient();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');

  // Queries
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles', { page: currentPage, limit: pageSize, search: searchQuery }],
    queryFn: () => roleAPI.getAll({ page: currentPage, limit: pageSize, search: searchQuery })
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: permissionAPI.getAll
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: roleAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles']);
      setShowModal(false);
      toast.success('Rôle créé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => roleAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles']);
      setShowModal(false);
      toast.success('Rôle modifié avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles']);
      setShowDeleteDialog(false);
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const createPermissionMutation = useMutation({
    mutationFn: permissionAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-permissions']);
      setShowModal(false);
      toast.success('Permission créée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  });

  // Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedRole(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setModalType('');
  };

  const handleDelete = () => {
    if (selectedRole) {
      deleteRoleMutation.mutate(selectedRole.id);
    }
  };

  // Role Form Component
  const RoleForm = ({ role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: role?.nom || '',
      permissions: role?.permissions?.map(p => p.id) || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handlePermissionChange = (permissionId, checked) => {
      setFormData(prev => ({
        ...prev,
        permissions: checked
          ? [...prev.permissions, permissionId]
          : prev.permissions.filter(id => id !== permissionId)
      }));
    };

    const selectAllInModule = (modulePermissions, selectAll) => {
      const moduleIds = modulePermissions.map(p => p.id);
      setFormData(prev => ({
        ...prev,
        permissions: selectAll
          ? [...new Set([...prev.permissions, ...moduleIds])]
          : prev.permissions.filter(id => !moduleIds.includes(id))
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du rôle *
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            placeholder="Ex: Gestionnaire, Technicien, Superviseur"
          />
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions
          </label>
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
            {permissionsData?.data && Object.keys(permissionsData.data).map(module => {
              const modulePermissions = permissionsData.data[module];
              const allSelected = modulePermissions.every(p => formData.permissions.includes(p.id));
              const someSelected = modulePermissions.some(p => formData.permissions.includes(p.id));
              
              return (
                <div key={module} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {module.replace('_', ' ')}
                    </h4>
                    <button
                      type="button"
                      onClick={() => selectAllInModule(modulePermissions, !allSelected)}
                      className={`text-xs px-2 py-1 rounded ${
                        allSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                    {modulePermissions.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                          {permission.action}
                          {permission.description && (
                            <span className="text-gray-500 ml-1">- {permission.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Sélectionnez les permissions que ce rôle devrait avoir. Les utilisateurs avec ce rôle hériteront de ces permissions.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
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

  // Role Detail Component
  const RoleDetail = ({ role }) => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{role.nom}</h3>
            <p className="text-gray-600">
              {role.userCount || 0} utilisateur{(role.userCount || 0) !== 1 ? 's' : ''} assigné{(role.userCount || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Permissions assignées</h4>
        {role.permissions && role.permissions.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(
              role.permissions.reduce((acc, perm) => {
                if (!acc[perm.module]) acc[perm.module] = [];
                acc[perm.module].push(perm);
                return acc;
              }, {})
            ).map(([module, permissions]) => (
              <div key={module} className="border rounded-lg p-3">
                <h5 className="font-medium text-gray-800 mb-2 capitalize">
                  {module.replace('_', ' ')}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {permissions.map(permission => (
                    <span
                      key={permission.id}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {permission.action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucune permission assignée</p>
        )}
      </div>

      {role.users && role.users.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Utilisateurs assignés</h4>
          <div className="space-y-2">
            {role.users.map(user => (
              <div key={user.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.nom}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Permission Form Component
  const PermissionForm = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      module: '',
      action: '',
      description: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module *
            </label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.module}
              onChange={(e) => setFormData(prev => ({ ...prev, module: e.target.value }))}
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.action}
              onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
              placeholder="Ex: read, create, update, delete"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description de cette permission..."
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
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
            <span>Créer</span>
          </button>
        </div>
      </form>
    );
  };

  // Permissions Table Component
  const PermissionsTable = () => {
    if (permissionsLoading) {
      return <LoadingSpinner />;
    }

    const flatPermissions = permissionsData?.data ? 
      Object.entries(permissionsData.data).flatMap(([module, permissions]) =>
        permissions.map(p => ({ ...p, module }))
      ) : [];

    return (
      <DataTable
        data={flatPermissions}
        loading={permissionsLoading}
        columns={[
          { key: 'module', header: 'Module' },
          { key: 'action', header: 'Action' },
          { key: 'description', header: 'Description' },
          {
            key: 'id',
            header: 'Code',
            render: (value, row) => `${row.module}:${row.action}`
          }
        ]}
        actions={[
          {
            icon: Edit,
            label: 'Modifier',
            onClick: (row) => console.log('Edit permission:', row),
            className: 'text-yellow-600 hover:text-yellow-800'
          },
          {
            icon: Trash2,
            label: 'Supprimer',
            onClick: (row) => console.log('Delete permission:', row),
            className: 'text-red-600 hover:text-red-800'
          }
        ]}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span>Gestion des Rôles & Permissions</span>
            </h1>
            <p className="text-gray-600 mt-1">Configurez les rôles et permissions du système</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'permissions' && (
              <button
                onClick={() => openModal('create-permission')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Permission</span>
              </button>
            )}
            {activeTab === 'roles' && (
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Rôle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
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
                  onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Rechercher un rôle..."
                  />
                </div>
              </div>

              {/* Roles Table */}
              <DataTable
                data={rolesData?.data || []}
                loading={rolesLoading}
                columns={[
                  {
                    key: 'nom',
                    header: 'Nom du rôle',
                    render: (value) => (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{value}</span>
                      </div>
                    )
                  },
                  {
                    key: 'permissions',
                    header: 'Permissions',
                    render: (permissions) => (
                      <span className="text-sm text-gray-600">
                        {permissions?.length || 0} permission{(permissions?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    )
                  },
                  {
                    key: 'userCount',
                    header: 'Utilisateurs',
                    render: (count) => (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{count || 0}</span>
                      </div>
                    )
                  }
                ]}
                actions={[
                  {
                    icon: Eye,
                    label: 'Voir',
                    onClick: (row) => openModal('view', row),
                    className: 'text-blue-600 hover:text-blue-800'
                  },
                  {
                    icon: Edit,
                    label: 'Modifier',
                    onClick: (row) => openModal('edit', row),
                    className: 'text-yellow-600 hover:text-yellow-800'
                  },
                  {
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: (row) => {
                      setSelectedRole(row);
                      setShowDeleteDialog(true);
                    },
                    className: 'text-red-600 hover:text-red-800',
                    disabled: (row) => ['Admin', 'Administrateur', 'Super Admin'].includes(row.nom)
                  }
                ]}
                pagination={
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil((rolesData?.total || 0) / pageSize)}
                    totalItems={rolesData?.total || 0}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                }
              />
            </div>
          )}

          {activeTab === 'permissions' && <PermissionsTable />}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            modalType === 'create' ? 'Nouveau Rôle' :
            modalType === 'edit' ? 'Modifier Rôle' :
            modalType === 'view' ? 'Détails du Rôle' :
            modalType === 'create-permission' ? 'Nouvelle Permission' : ''
          }
          size={modalType === 'view' ? 'lg' : 'xl'}
        >
          {modalType === 'view' ? (
            <RoleDetail role={selectedRole} />
          ) : modalType === 'create-permission' ? (
            <PermissionForm
              onSubmit={(data) => createPermissionMutation.mutate(data)}
              loading={createPermissionMutation.isPending}
            />
          ) : (
            <RoleForm
              role={modalType === 'edit' ? selectedRole : null}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  updateRoleMutation.mutate({ id: selectedRole.id, data });
                } else {
                  createRoleMutation.mutate(data);
                }
              }}
              loading={createRoleMutation.isPending || updateRoleMutation.isPending}
            />
          )}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteRoleMutation.isPending}
      />
    </div>
  );
};

export default Roles;