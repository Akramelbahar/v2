// src/pages/UsersManagement.jsx
import React, { useState } from 'react';
import { 
  UserCheck, Plus, Search, Edit, Trash2, Eye, Lock, Power, 
  Mail, Phone, Building, Shield, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Filter, Download, Upload
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdateUserRole,
  useResetUserPassword,
  useToggleUserStatus,
  useRoles
} from '../hooks/useUsers';

const UsersManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  // Data queries
  const { data: usersData, isLoading } = useUsers({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery,
    ...filters 
  });
  
  const { data: roles } = useRoles();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const updateRoleMutation = useUpdateUserRole();
  const resetPasswordMutation = useResetUserPassword();
  const toggleStatusMutation = useToggleUserStatus();

  // Handlers
  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType('');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await resetPasswordMutation.mutateAsync(selectedUser.id);
      setShowResetPasswordDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: user.id,
        enabled: !user.enabled
      });
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  // User Form Component
  const UserForm = ({ user, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: user?.nom || '',
      username: user?.username || '',
      password: '',
      confirmPassword: '',
      section: user?.section || '',
      role_id: user?.role_id || ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.nom) {
        newErrors.nom = 'Le nom est requis';
      }
      
      if (!formData.username) {
        newErrors.username = 'Le nom d\'utilisateur est requis';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      }
      
      if (!user && !formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (!user && formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      
      if (!user && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
      
      if (!formData.role_id) {
        newErrors.role_id = 'Le rôle est requis';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      const { confirmPassword, ...submitData } = formData;
      
      // Don't send password if updating and password is empty
      if (user && !submitData.password) {
        delete submitData.password;
      }
      
      onSubmit(submitData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Nom complet"
            name="nom"
            required
            error={errors.nom}
          >
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Entrez le nom complet"
            />
          </FormField>

          <FormField
            label="Nom d'utilisateur"
            name="username"
            required
            error={errors.username}
          >
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Entrez le nom d'utilisateur"
              disabled={!!user}
            />
          </FormField>

          {!user && (
            <>
              <FormField
                label="Mot de passe"
                name="password"
                required
                error={errors.password}
              >
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Entrez le mot de passe"
                />
              </FormField>

              <FormField
                label="Confirmer le mot de passe"
                name="confirmPassword"
                required
                error={errors.confirmPassword}
              >
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirmez le mot de passe"
                />
              </FormField>
            </>
          )}

          <FormField
            label="Section"
            name="section"
            error={errors.section}
          >
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.section}
              onChange={(e) => handleChange('section', e.target.value)}
              placeholder="Ex: Maintenance, Technique"
            />
          </FormField>

          <FormField
            label="Rôle"
            name="role_id"
            required
            error={errors.role_id}
          >
            <Select
              value={roles?.find(r => r.id === formData.role_id) || null}
              onChange={(option) => handleChange('role_id', option?.id || '')}
              options={roles?.map(role => ({ value: role.id, label: role.nom })) || []}
              placeholder="Sélectionner un rôle"
              error={!!errors.role_id}
            />
          </FormField>
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
            <span>{user ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // User Detail Component
  const UserDetail = ({ user }) => {
    if (!user) return null;

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3">Informations de l'utilisateur</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Nom:</p>
              <p className="text-sm text-gray-900">{user.nom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Nom d'utilisateur:</p>
              <p className="text-sm text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Section:</p>
              <p className="text-sm text-gray-900">{user.section || 'Non définie'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Rôle:</p>
              <p className="text-sm text-gray-900">{user.role?.nom || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Statut:</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.enabled ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactif
                  </>
                )}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Créé le:</p>
              <p className="text-sm text-gray-900">{formatDateTime(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {user.role?.permissions && user.role.permissions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-3">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {user.role.permissions.map((permission, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {permission.module}:{permission.action}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              closeModal();
              openModal('user', user);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setShowResetPasswordDialog(true);
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Réinitialiser le mot de passe</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez les utilisateurs et leurs accès au système</p>
          </div>
          <button 
            onClick={() => openModal('user')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom ou username..."
            />
          </div>
          <Select
            value={filters.role_id ? roles?.find(r => r.id === filters.role_id) : null}
            onChange={(option) => setFilters(prev => ({ 
              ...prev, 
              role_id: option?.value || undefined 
            }))}
            options={roles?.map(role => ({ 
              value: role.id, 
              label: role.nom 
            })) || []}
            placeholder="Tous les rôles"
            className="w-full md:w-48"
          />
          <Select
            value={filters.enabled !== undefined ? {
              value: filters.enabled,
              label: filters.enabled ? 'Actifs' : 'Inactifs'
            } : null}
            onChange={(option) => setFilters(prev => ({ 
              ...prev, 
              enabled: option?.value 
            }))}
            options={[
              { value: undefined, label: 'Tous' },
              { value: true, label: 'Actifs' },
              { value: false, label: 'Inactifs' }
            ]}
            placeholder="Tous les statuts"
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={usersData?.data || []}
        loading={isLoading}
        columns={[
          { 
            key: 'nom', 
            header: 'Nom',
            render: (value, row) => (
              <div>
                <div className="font-medium">{value}</div>
                <div className="text-sm text-gray-500">@{row.username}</div>
              </div>
            )
          },
          { 
            key: 'section', 
            header: 'Section',
            render: (value) => value || 'Non définie'
          },
          { 
            key: 'role', 
            header: 'Rôle',
            render: (value) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Shield className="w-3 h-3 mr-1" />
                {value?.nom || 'Non défini'}
              </span>
            )
          },
          { 
            key: 'enabled', 
            header: 'Statut',
            render: (value) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactif
                  </>
                )}
              </span>
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
            onClick: (row) => openModal('user-detail', row),
            className: 'text-blue-600 hover:text-blue-800'
          },
          {
            icon: Edit,
            label: 'Modifier',
            onClick: (row) => openModal('user', row),
            className: 'text-yellow-600 hover:text-yellow-800'
          },
          {
            icon: Power,
            label: (row) => row.enabled ? 'Désactiver' : 'Activer',
            onClick: (row) => handleToggleStatus(row),
            className: (row) => row.enabled ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
          },
          {
            icon: Trash2,
            label: 'Supprimer',
            onClick: (row) => {
              setSelectedUser(row);
              setShowDeleteDialog(true);
            },
            className: 'text-red-600 hover:text-red-800',
            disabled: (row) => row.id === 1 // Prevent deleting the main admin
          }
        ]}
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((usersData?.total || 0) / pageSize)}
            totalItems={usersData?.total || 0}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        }
      />

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          modalType === 'user' 
            ? (selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur')
            : 'Détails de l\'utilisateur'
        }
        size={modalType === 'user-detail' ? 'lg' : 'md'}
      >
        {modalType === 'user' && (
          <UserForm
            user={selectedUser}
            onSubmit={async (data) => {
              try {
                if (selectedUser) {
                  await updateUserMutation.mutateAsync({ 
                    id: selectedUser.id, 
                    data 
                  });
                } else {
                  await createUserMutation.mutateAsync(data);
                }
                closeModal();
              } catch (error) {
                console.error('Submit error:', error);
              }
            }}
            loading={createUserMutation.isPending || updateUserMutation.isPending}
          />
        )}
        {modalType === 'user-detail' && (
          <UserDetail user={selectedUser} />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteUserMutation.isPending}
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        isOpen={showResetPasswordDialog}
        onClose={() => setShowResetPasswordDialog(false)}
        onConfirm={handleResetPassword}
        title="Réinitialiser le mot de passe"
        message={`Êtes-vous sûr de vouloir réinitialiser le mot de passe de "${selectedUser?.nom}" ? Un nouveau mot de passe sera envoyé à l'utilisateur.`}
        type="warning"
        confirmText="Réinitialiser"
        loading={resetPasswordMutation.isPending}
      />
    </div>
  );
};

export default UsersManagement;