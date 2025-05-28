import React, { useState } from 'react';
import { 
  Shield, Plus, Users, Settings, Edit, Trash2, Eye, 
  UserCheck, Key, Lock, AlertCircle, CheckCircle,
  Search, Filter, RefreshCw
} from 'lucide-react';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RoleForm from '../components/roles/RoleForm';
import PermissionMatrix from '../components/roles/PermissionMatrix';
import UserRoleManagement from '../components/roles/UserRoleManagement';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const RoleManagement = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);

  // API hooks
  const { 
    data: rolesData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useRoles({
    page: currentPage,
    limit: pageSize,
    search: searchQuery
  });

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Event handlers
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowRoleForm(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowRoleForm(true);
  };

  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      setShowDeleteDialog(false);
      setSelectedRole(null);
      toast.success('Rôle supprimé avec succès');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handlePermissionMatrix = (role) => {
    setSelectedRole(role);
    setShowPermissionMatrix(true);
  };

  // Role statistics
  const roleStats = React.useMemo(() => {
    const roles = rolesData?.data || [];
    return {
      total: roles.length,
      active: roles.filter(r => r.active !== false).length,
      systemRoles: roles.filter(r => r.isSystem).length,
      customRoles: roles.filter(r => !r.isSystem).length
    };
  }, [rolesData?.data]);

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Impossible de charger les rôles'}
          </p>
          <button
            onClick={() => refetch()}
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span>Gestion des Rôles et Permissions</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les rôles utilisateurs et leurs permissions d'accès
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{roleStats.total}</div>
              <div className="text-xs text-gray-500">Total Rôles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{roleStats.active}</div>
              <div className="text-xs text-gray-500">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{roleStats.customRoles}</div>
              <div className="text-xs text-gray-500">Personnalisés</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'roles', label: 'Rôles', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Key },
              { id: 'users', label: 'Utilisateurs', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
      </div>

      {/* Tab Content */}
      {activeTab === 'roles' && (
        <RoleManagementTab
          roles={rolesData?.data || []}
          loading={isLoading}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onCreateRole={handleCreateRole}
          onEditRole={handleEditRole}
          onDeleteRole={handleDeleteClick}
          onPermissionMatrix={handlePermissionMatrix}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={rolesData?.total || 0}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {activeTab === 'permissions' && (
        <PermissionManagementTab />
      )}

      {activeTab === 'users' && (
        <UserRoleManagement />
      )}

      {/* Role Form Modal */}
      <RoleForm
        isOpen={showRoleForm}
        onClose={() => setShowRoleForm(false)}
        role={selectedRole}
        onSuccess={() => {
          setShowRoleForm(false);
          setSelectedRole(null);
        }}
      />

      {/* Permission Matrix Modal */}
      {showPermissionMatrix && (
        <PermissionMatrix
          isOpen={showPermissionMatrix}
          onClose={() => setShowPermissionMatrix(false)}
          role={selectedRole}
          onSuccess={() => {
            setShowPermissionMatrix(false);
            setSelectedRole(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le rôle"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer le rôle :</p>
            <p className="font-semibold mt-2">{selectedRole?.nom}</p>
            <p className="text-sm text-gray-600 mt-2">
              Cette action est irréversible. Tous les utilisateurs assignés à ce rôle perdront leurs permissions.
            </p>
          </div>
        }
        type="danger"
        confirmText="Supprimer"
        loading={deleteRoleMutation.isPending}
      />
    </div>
  );
};

// Role Management Tab Component
const RoleManagementTab = ({
  roles,
  loading,
  searchQuery,
  onSearch,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onPermissionMatrix,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) => {
  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={onSearch}
              placeholder="Rechercher un rôle..."
              className="w-full"
            />
          </div>
          
          <button
            onClick={onCreateRole}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Rôle</span>
          </button>
        </div>
      </div>

      {/* Roles Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <LoadingSpinner text="Chargement des rôles..." />
        </div>
      ) : (
        <RoleTable
          roles={roles}
          onEdit={onEditRole}
          onDelete={onDeleteRole}
          onPermissionMatrix={onPermissionMatrix}
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
};

// Role Table Component
const RoleTable = ({ roles, onEdit, onDelete, onPermissionMatrix }) => {
  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun rôle trouvé
        </h3>
        <p className="text-gray-600">
          Créez votre premier rôle pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateurs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Shield className={`w-8 h-8 mr-3 ${
                      role.isSystem ? 'text-blue-500' : 'text-purple-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {role.nom}
                      </div>
                      {role.isSystem && (
                        <div className="text-xs text-blue-600">Rôle système</div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    {role.description || 'Aucune description'}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                      {role.permissionCount || 0} permission(s)
                    </span>
                    <button
                      onClick={() => onPermissionMatrix(role)}
                      className="text-purple-600 hover:text-purple-800 text-xs underline"
                    >
                      Voir détails
                    </button>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {role.userCount || 0} utilisateur(s)
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {role.active !== false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactif
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPermissionMatrix(role)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded"
                      title="Gérer les permissions"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onEdit(role)}
                      className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {!role.isSystem && (
                      <button
                        onClick={() => onDelete(role)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Permission Management Tab Component
const PermissionManagementTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-center">
        <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Gestion des Permissions
        </h3>
        <p className="text-gray-600">
          Cette section permettra de gérer les permissions système de manière globale.
        </p>
      </div>
    </div>
  );
};

export default RoleManagement;