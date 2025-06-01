import React, { useState } from 'react';
import { 
  UserCheck, Users as UsersIcon, Plus, Search, Edit, Trash2, Eye, EyeOff,
  AlertCircle, Shield, Settings, Mail, Phone, MapPin, Calendar,
  Filter, RefreshCw, Download, Upload, MoreVertical, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import Select from '../components/forms/Select';
import FormField from '../components/forms/FormField';

// Import hooks (we'll create a simple data fetching approach)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { truncateText } from '../utils/formatUtils';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser, hasPermission, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Simple data fetching functions
  const fetchUsers = async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  };

  const fetchRoles = async () => {
    const response = await api.get('/roles');
    return response.data.data || response.data;
  };

  // Data queries using React Query directly
  const { 
    data: usersResponse, 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['users', { page: currentPage, limit: pageSize, search: searchQuery, ...filters }],
    queryFn: () => fetchUsers({ page: currentPage, limit: pageSize, search: searchQuery, ...filters }),
    keepPreviousData: true
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 600000
  });

  // Get users data from response
  const usersData = usersResponse?.data || [];
  const totalUsers = usersResponse?.pagination?.total || 0;
  const totalPages = usersResponse?.pagination?.pages || 1;

  // Mutations
  const queryClient = useQueryClient();
  
  const createUserMutation = useMutation({
    mutationFn: (userData) => api.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur créé avec succès');
      closeModal();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur modifié avec succès');
      closeModal();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur';
      toast.error(message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
      toast.error(message);
    }
  });

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

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
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

  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // User Form Component
  const UserForm = ({ user, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: user?.nom || '',
      username: user?.username || '',
      password: user ? '' : '', // Only required for new users
      section: user?.section || '',
      role_id: user?.role_id || '',
      enabled: user?.enabled !== undefined ? user.enabled : true
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
      const newErrors = {};

      if (!formData.nom.trim()) {
        newErrors.nom = 'Le nom est requis';
      }

      if (!formData.username.trim()) {
        newErrors.username = 'Le nom d\'utilisateur est requis';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      }

      if (!user && !formData.password) {
        newErrors.password = 'Le mot de passe est requis pour un nouvel utilisateur';
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      if (!formData.role_id) {
        newErrors.role_id = 'Le rôle est requis';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        // Remove password if empty (for updates)
        const submitData = { ...formData };
        if (user && !submitData.password) {
          delete submitData.password;
        }
        onSubmit(submitData);
      }
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <FormField
            label="Nom complet"
            name="nom"
            required
            error={errors.nom}
          >
            <input
              type="text"
              className="form-input"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Nom complet de l'utilisateur"
            />
          </FormField>

          {/* Username */}
          <FormField
            label="Nom d'utilisateur"
            name="username"
            required
            error={errors.username}
            help={user ? "Le nom d'utilisateur ne peut pas être modifié" : undefined}
          >
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Nom d'utilisateur unique"
              disabled={!!user}
            />
          </FormField>

          {/* Password */}
          <FormField
            label={user ? "Nouveau mot de passe" : "Mot de passe"}
            name="password"
            required={!user}
            error={errors.password}
            help={user ? "Laissez vide pour conserver le mot de passe actuel" : undefined}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pr-10"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={user ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </FormField>

          {/* Section */}
          <FormField
            label="Section"
            name="section"
            error={errors.section}
          >
            <input
              type="text"
              className="form-input"
              value={formData.section}
              onChange={(e) => handleChange('section', e.target.value)}
              placeholder="Section ou département"
            />
          </FormField>

          {/* Role */}
          <FormField
            label="Rôle"
            name="role_id"
            required
            error={errors.role_id}
          >
            <select
              className="form-input"
              value={formData.role_id}
              onChange={(e) => handleChange('role_id', e.target.value)}
            >
              <option value="">Sélectionner un rôle</option>
              {roles?.map(role => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </FormField>

          {/* Status */}
          <FormField
            label="Statut du compte"
            name="enabled"
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="text-sm text-gray-700">
                Compte activé
              </label>
            </div>
          </FormField>
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
            <span>{user ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // User Detail Modal
  const UserDetailModal = ({ user }) => {
    if (!user) return null;

    return (
      <div className="space-y-6">
        {/* User Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl font-bold">
              {getUserInitials(user.nom)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.nom}</h3>
              <p className="text-blue-100">@{user.username}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-blue-200">{user.role?.nom || 'Aucun rôle'}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.enabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {user.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">Informations générales</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Nom complet</label>
              <p className="text-gray-900">{user.nom}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Nom d'utilisateur</label>
              <p className="text-gray-900">{user.username}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Section</label>
              <p className="text-gray-900">{user.section || 'Non définie'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">Rôle et permissions</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Rôle</label>
              <p className="text-gray-900">{user.role?.nom || 'Aucun rôle'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Permissions</label>
              <div className="mt-2">
                {user.role?.permissions?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.role.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {permission.description || `${permission.module}:${permission.action}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune permission spécifique</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Informations du compte</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Créé le</label>
              <p className="text-gray-900">{formatDateTime(user.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Dernière modification</label>
              <p className="text-gray-900">{formatDateTime(user.updatedAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Statut</label>
              <p className={`font-medium ${user.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {user.enabled ? 'Compte actif' : 'Compte désactivé'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {hasPermission('users:update') && (
            <button 
              onClick={() => {
                closeModal();
                openModal('user', user);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
          
          {hasPermission('users:delete') && user.id !== currentUser?.id && (
            <button 
              onClick={() => {
                closeModal();
                openDeleteDialog(user);
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
      key: 'user',
      header: 'Utilisateur',
      render: (_, user) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {getUserInitials(user.nom)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.nom}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3 mr-1" />
          {value?.nom || 'Aucun rôle'}
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
          {value ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      render: (value) => formatDate(value)
    }
  ];

  // Table actions
  const actions = hasPermission('users:read') || isAdmin() ? [
    {
      icon: Eye,
      label: 'Voir',
      onClick: (user) => openModal('user-detail', user),
      className: 'text-blue-600 hover:text-blue-800'
    },
    ...(hasPermission('users:update') || isAdmin() ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (user) => openModal('user', user),
      className: 'text-yellow-600 hover:text-yellow-800'
    }] : []),
    ...(hasPermission('users:delete') || isAdmin() ? [{
      icon: Trash2,
      label: 'Supprimer',
      onClick: (user) => openDeleteDialog(user),
      className: 'text-red-600 hover:text-red-800',
      disabled: (user) => user.id === currentUser?.id // Can't delete self
    }] : [])
  ] : null;

  // Render modal content
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      user: {
        title: selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur',
        size: 'lg',
        content: (
          <UserForm
            user={selectedUser}
            onSubmit={(data) => {
              if (selectedUser) {
                updateUserMutation.mutate({ id: selectedUser.id, data });
              } else {
                createUserMutation.mutate(data);
              }
            }}
            loading={createUserMutation.isPending || updateUserMutation.isPending}
          />
        )
      },
      'user-detail': {
        title: 'Détails de l\'utilisateur',
        size: 'xl',
        content: <UserDetailModal user={selectedUser} />
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
  if (usersError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">
            Impossible de charger la liste des utilisateurs
          </p>
          <button
            onClick={() => refetchUsers()}
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
              <UsersIcon className="w-6 h-6" />
              <span>Gestion des Utilisateurs</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => refetchUsers()}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
            {hasPermission('users:create') || isAdmin() && (
              <button 
                onClick={() => openModal('user')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel utilisateur</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom ou nom d'utilisateur..."
            />
          </div>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.role_id || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              role_id: e.target.value || undefined 
            }))}
          >
            <option value="">Tous les rôles</option>
            {roles?.map(role => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.enabled || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              enabled: e.target.value || undefined 
            }))}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actifs uniquement</option>
            <option value="false">Inactifs uniquement</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={usersData || []}
        columns={columns}
        loading={usersLoading}
        actions={actions}
        emptyMessage="Aucun utilisateur trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
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
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteUserMutation.isPending}
      />
    </div>
  );
};

export default Users;