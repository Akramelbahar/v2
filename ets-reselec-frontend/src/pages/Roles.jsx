// src/pages/Roles.jsx
import React, { useState } from 'react';
import { 
  Shield, Plus, Edit, Trash2, Eye, Users, Lock, CheckCircle, 
  XCircle, AlertCircle, Package, Wrench, FileText, BarChart3,
  Settings, ChevronRight, Save, X
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FormField from '../components/forms/FormField';
import { formatDate } from '../utils/dateUtils';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions
} from '../hooks/useUsers';

const Roles = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updatePermissionsMutation = useUpdateRolePermissions();

  // Group permissions by module
  const groupedPermissions = permissions?.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {}) || {};

  // Module icons
  const moduleIcons = {
    clients: Users,
    equipment: Package,
    interventions: Wrench,
    reports: FileText,
    analytics: BarChart3,
    users: Users,
    roles: Shield,
    settings: Settings
  };

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

  // Role Form Component
  const RoleForm = ({ role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: role?.nom || ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.nom) {
        newErrors.nom = 'Le nom du rôle est requis';
      } else if (formData.nom.length < 3) {
        newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Nom du rôle"
          name="nom"
          required
          error={errors.nom}
        >
          <input
            type="text"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.nom}
            onChange={(e) => {
              setFormData({ nom: e.target.value });
              if (errors.nom) setErrors({});
            }}
            placeholder="Ex: Technicien, Superviseur"
          />
        </FormField>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note:</p>
              <p>Les permissions peuvent être configurées après la création du rôle.</p>
            </div>
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

  // Permissions Editor Component
  const PermissionsEditor = ({ role }) => {
    const [selectedPermissions, setSelectedPermissions] = useState(
      role?.permissions?.map(p => p.id) || []
    );
    const [hasChanges, setHasChanges] = useState(false);

    const handleTogglePermission = (permissionId) => {
      setSelectedPermissions(prev => {
        if (prev.includes(permissionId)) {
          return prev.filter(id => id !== permissionId);
        } else {
          return [...prev, permissionId];
        }
      });
      setHasChanges(true);
    };

    const handleToggleModule = (modulePermissions) => {
      const modulePermissionIds = modulePermissions.map(p => p.id);
      const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
      
      setSelectedPermissions(prev => {
        if (allSelected) {
          return prev.filter(id => !modulePermissionIds.includes(id));
        } else {
          return [...new Set([...prev, ...modulePermissionIds])];
        }
      });
      setHasChanges(true);
    };

    const handleSave = async () => {
      try {
        await updatePermissionsMutation.mutateAsync({
          roleId: role.id,
          permissionIds: selectedPermissions
        });
        setHasChanges(false);
        closeModal();
      } catch (error) {
        console.error('Save permissions error:', error);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-2">Rôle: {role.nom}</h4>
          <p className="text-sm text-gray-600">
            Sélectionnez les permissions à attribuer à ce rôle
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
            const ModuleIcon = moduleIcons[module] || Shield;
            const allSelected = modulePermissions.every(p => 
              selectedPermissions.includes(p.id)
            );
            const someSelected = modulePermissions.some(p => 
              selectedPermissions.includes(p.id)
            ) && !allSelected;

            return (
              <div key={module} className="border rounded-lg overflow-hidden">
                <div 
                  className="bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => handleToggleModule(modulePermissions)}
                >
                  <div className="flex items-center space-x-3">
                    <ModuleIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium capitalize">{module}</h5>
                      <p className="text-sm text-gray-500">
                        {modulePermissions.length} permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      allSelected 
                        ? 'bg-blue-600 border-blue-600' 
                        : someSelected 
                          ? 'bg-blue-100 border-blue-600'
                          : 'border-gray-300'
                    }`}>
                      {allSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      {someSelected && <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 space-y-2">
                  {modulePermissions.map(permission => (
                    <label 
                      key={permission.id}
                      className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handleTogglePermission(permission.id)}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {permission.action === 'read' && 'Lecture'}
                            {permission.action === 'create' && 'Création'}
                            {permission.action === 'update' && 'Modification'}
                            {permission.action === 'delete' && 'Suppression'}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          )}
                        </div>
                      </div>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {permission.module}:{permission.action}
                      </code>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updatePermissionsMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {updatePermissionsMutation.isPending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    );
  };

  // Role Detail Component
  const RoleDetail = ({ role }) => {
    if (!role) return null;

    const rolePermissions = role.permissions || [];
    const permissionsByModule = rolePermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3">Informations du rôle</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Nom:</p>
              <p className="text-sm text-gray-900">{role.nom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Nombre d'utilisateurs:</p>
              <p className="text-sm text-gray-900">{role.userCount || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Créé le:</p>
              <p className="text-sm text-gray-900">{formatDate(role.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Permissions:</p>
              <p className="text-sm text-gray-900">{rolePermissions.length} permissions</p>
            </div>
          </div>
        </div>

        {Object.keys(permissionsByModule).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-3">Permissions attribuées</h4>
            <div className="space-y-3">
              {Object.entries(permissionsByModule).map(([module, permissions]) => {
                const ModuleIcon = moduleIcons[module] || Shield;
                return (
                  <div key={module} className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <ModuleIcon className="w-4 h-4 text-gray-600" />
                      <h5 className="font-medium capitalize">{module}</h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(permission => (
                        <span
                          key={permission.id}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          {permission.action === 'read' && 'Lecture'}
                          {permission.action === 'create' && 'Création'}
                          {permission.action === 'update' && 'Modification'}
                          {permission.action === 'delete' && 'Suppression'}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              closeModal();
              openModal('permissions', role);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Gérer les permissions</span>
          </button>
          <button
            onClick={() => {
              closeModal();
              openModal('role', role);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>
    );
  };

  if (rolesLoading || permissionsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles et Permissions</h1>
            <p className="text-gray-600 mt-1">Configurez les rôles et leurs permissions</p>
          </div>
          <button 
            onClick={() => openModal('role')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Rôle</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total des rôles</p>
              <p className="text-3xl font-bold text-gray-900">{roles?.length || 0}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Permissions disponibles</p>
              <p className="text-3xl font-bold text-gray-900">{permissions?.length || 0}</p>
            </div>
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Modules</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(groupedPermissions).length}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Liste des rôles</h2>
        </div>
        
        <DataTable
          data={roles || []}
          loading={rolesLoading}
          columns={[
            { 
              key: 'nom', 
              header: 'Nom du rôle',
              render: (value) => (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{value}</span>
                </div>
              )
            },
            { 
              key: 'permissions', 
              header: 'Permissions',
              render: (value) => {
                const count = value?.length || 0;
                return (
                  <span className="text-sm text-gray-600">
                    {count} permission{count !== 1 ? 's' : ''}
                  </span>
                );
              }
            },
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
              key: 'createdAt', 
              header: 'Créé le',
              render: (value) => formatDate(value)
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
              icon: Shield,
              label: 'Permissions',
              onClick: (row) => openModal('permissions', row),
              className: 'text-purple-600 hover:text-purple-800'
            },
            {
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('role', row),
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
              disabled: (row) => row.nom === 'Administrateur' || row.userCount > 0
            }
          ]}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          modalType === 'role' 
            ? (selectedRole ? 'Modifier le rôle' : 'Nouveau rôle')
            : modalType === 'permissions'
              ? 'Gérer les permissions'
              : 'Détails du rôle'
        }
        size={modalType === 'permissions' ? 'xl' : modalType === 'role-detail' ? 'lg' : 'md'}
      >
        {modalType === 'role' && (
          <RoleForm
            role={selectedRole}
            onSubmit={async (data) => {
              try {
                if (selectedRole) {
                  await updateRoleMutation.mutateAsync({ 
                    id: selectedRole.id, 
                    data 
                  });
                } else {
                  await createRoleMutation.mutateAsync(data);
                }
                closeModal();
              } catch (error) {
                console.error('Submit error:', error);
              }
            }}
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        )}
        {modalType === 'permissions' && (
          <PermissionsEditor role={selectedRole} />
        )}
        {modalType === 'role-detail' && (
          <RoleDetail role={selectedRole} />
        )}
      </Modal>

      {/* Delete Confirmation */}
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