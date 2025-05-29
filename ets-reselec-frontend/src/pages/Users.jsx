import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Plus, Search, Edit, Trash2, Eye, Filter, 
  Settings, Shield, Mail, Phone, AlertCircle, CheckCircle,
  X, Save, Users as UsersIcon, Key, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import hooks - we'll need to create these
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useUserById 
} from '../hooks/useUsers';
import { useRoles } from '../hooks/useRoles';
import { useSections } from '../hooks/useSections';

import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatPhoneNumber, truncateText } from '../utils/formatUtils';

const Users = () => {
  const { user: currentUser, hasPermission, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    ...filters
  });

  const { data: roles } = useRoles();
  const { data: sections } = useSections();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Handlers
  const openModal = (type, userData = null) => {
    setModalType(type);
    setSelectedUser(userData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType('');
  };

  const openDeleteDialog = (userData) => {
    setSelectedUser(userData);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
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

  // User Form Component
  const UserForm = ({ userData, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: userData?.nom || '',
      username: userData?.username || '',
      password: userData ? '' : '', // Empty for edit, required for create
      section: userData?.section || '',
      role_id: userData?.role_id || '',
      section_id: userData?.section_id || '',
      email: userData?.email || '',
      telephone: userData?.telephone || '',
      actif: userData?.actif !== undefined ? userData.actif : true
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when field is modified
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    };

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

      if (!userData && !formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      if (!formData.role_id) {
        newErrors.role_id = 'Le rôle est requis';
      }

      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      // Remove empty password for updates
      const submitData = { ...formData };
      if (userData && !submitData.password) {
        delete submitData.password;
      }

      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom complet */}
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

          {/* Nom d'utilisateur */}
          <FormField
            label="Nom d'utilisateur"
            name="username"
            required
            error={errors.username}
            help={userData ? "Le nom d'utilisateur ne peut pas être modifié" : undefined}
          >
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Nom d'utilisateur unique"
              disabled={!!userData}
            />
          </FormField>

          {/* Email */}
          <FormField
            label="Email"
            name="email"
            error={errors.email}
          >
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="adresse@email.com"
            />
          </FormField>

          {/* Téléphone */}
          <FormField
            label="Téléphone"
            name="telephone"
          >
            <input
              type="tel"
              className="form-input"
              value={formData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="+212 6XX XX XX XX"
            />
          </FormField>

          {/* Mot de passe */}
          <FormField
            label={userData ? "Nouveau mot de passe" : "Mot de passe"}
            name="password"
            required={!userData}
            error={errors.password}
            help={userData ? "Laissez vide pour conserver le mot de passe actuel" : undefined}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pr-10"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={userData ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5 text-gray-400" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </FormField>

          {/* Section */}
          <FormField
            label="Section"
            name="section"
          >
            <input
              type="text"
              className="form-input"
              value={formData.section}
              onChange={(e) => handleChange('section', e.target.value)}
              placeholder="Ex: Maintenance, Administration"
            />
          </FormField>

          {/* Rôle */}
          <FormField
            label="Rôle"
            name="role_id"
            required
            error={errors.role_id}
          >
            <Select
              value={roles?.find(r => r.id === formData.role_id) || null}
              onChange={(option) => handleChange('role_id', option?.value || '')}
              options={roles?.map(role => ({
                value: role.id,
                label: role.nom
              })) || []}
              placeholder="Sélectionner un rôle"
            />
          </FormField>

          {/* Section (from list) */}
          {sections && sections.length > 0 && (
            <FormField
              label="Section assignée"
              name="section_id"
            >
              <Select
                value={sections?.find(s => s.id === formData.section_id) || null}
                onChange={(option) => handleChange('section_id', option?.value || '')}
                options={sections?.map(section => ({
                  value: section.id,
                  label: section.nom
                })) || []}
                placeholder="Sélectionner une section"
              />
            </FormField>
          )}

          {/* Statut actif */}
          <FormField
            label="Statut"
            name="actif"
          >
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actif"
                  checked={formData.actif === true}
                  onChange={() => handleChange('actif', true)}
                  className="mr-2"
                />
                <span className="text-green-700">Actif</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actif"
                  checked={formData.actif === false}
                  onChange={() => handleChange('actif', false)}
                  className="mr-2"
                />
                <span className="text-red-700">Inactif</span>
              </label>
            </div>
          </FormField>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>{userData ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // User Detail Component
  const UserDetail = ({ userData }) => {
    const { data: userDetails, isLoading } = useUserById(userData?.id);

    if (isLoading) {
      return <LoadingSpinner />;
    }

    const user = userDetails || userData;

    return (
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl font-bold">
              {user.nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.nom}</h3>
              <p className="text-blue-100">@{user.username}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.actif ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {user.actif ? 'Actif' : 'Inactif'}
                </span>
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {user.role?.nom || user.role || 'Aucun rôle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Informations personnelles</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Téléphone</label>
                <p className="text-gray-900">{formatPhoneNumber(user.telephone) || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Section</label>
                <p className="text-gray-900">{user.section || 'Non assigné'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Rôle et permissions</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Rôle</label>
                <p className="text-gray-900">{user.role?.nom || user.role || 'Aucun rôle'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Permissions</label>
                <div className="mt-2">
                  {user.permissions && user.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                        >
                          {permission}
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
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Activité</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {user.clientsCrees?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Clients créés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {user.equipementsAjoutes?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Équipements ajoutés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user.interventionsCrees?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Interventions créées</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
          <div className="flex flex-wrap gap-3">
            {hasPermission('users:update') && (
              <button 
                onClick={() => {
                  closeModal();
                  openModal('user', user);
                }}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            )}
            
            <button 
              onClick={() => openModal('reset-password', user)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Réinitialiser mot de passe</span>
            </button>

            {user.id !== currentUser?.id && hasPermission('users:delete') && (
              <button 
                onClick={() => {
                  closeModal();
                  openDeleteDialog(user);
                }}
                className="btn btn-error flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reset Password Form
  const ResetPasswordForm = ({ userData, onSubmit, loading }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!newPassword || newPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      onSubmit({ password: newPassword });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Réinitialisation du mot de passe</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Vous êtes sur le point de réinitialiser le mot de passe de <strong>{userData.nom}</strong>.
                L'utilisateur devra utiliser ce nouveau mot de passe pour se connecter.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </p>
          </div>
        )}

        <FormField
          label="Nouveau mot de passe"
          name="newPassword"
          required
        >
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Entrez le nouveau mot de passe"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye className="h-5 w-5 text-gray-400" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </FormField>

        <FormField
          label="Confirmer le mot de passe"
          name="confirmPassword"
          required
        >
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez le nouveau mot de passe"
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-warning flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Key className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </form>
    );
  };

  // Modal renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      user: {
        title: selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur',
        size: 'xl',
        content: (
          <UserForm
            userData={selectedUser}
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
        content: <UserDetail userData={selectedUser} />
      },
      'reset-password': {
        title: 'Réinitialiser le mot de passe',
        size: 'md',
        content: (
          <ResetPasswordForm
            userData={selectedUser}
            onSubmit={(data) => {
              updateUserMutation.mutate({ 
                id: selectedUser.id, 
                data,
                isPasswordReset: true 
              });
            }}
            loading={updateUserMutation.isPending}
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

  // Render users table
  const renderUsersTable = () => (
    <DataTable
      data={usersData?.data || []}
      loading={usersLoading}
      columns={[
        {
          key: 'nom',
          header: 'Utilisateur',
          render: (value, row) => (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {value?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">@{row.username}</div>
              </div>
            </div>
          )
        },
        {
          key: 'email',
          header: 'Email',
          render: (value) => value || <span className="text-gray-400">Non renseigné</span>
        },
        {
          key: 'role',
          header: 'Rôle',
          render: (value) => (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {typeof value === 'object' ? value?.nom : value || 'Aucun'}
            </span>
          )
        },
        {
          key: 'section',
          header: 'Section',
          render: (value) => value || <span className="text-gray-400">Non assigné</span>
        },
        {
          key: 'actif',
          header: 'Statut',
          render: (value) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value ? 'Actif' : 'Inactif'}
            </span>
          )
        },
        {
          key: 'createdAt',
          header: 'Créé le',
          render: (value) => value ? formatDate(value) : '-'
        }
      ]}
      actions={[
        {
          icon: Eye,
          label: 'Voir',
          onClick: (row) => openModal('user-detail', row),
          className: 'text-blue-600 hover:text-blue-800'
        },
        ...(hasPermission('users:update') ? [{
          icon: Edit,
          label: 'Modifier',
          onClick: (row) => openModal('user', row),
          className: 'text-yellow-600 hover:text-yellow-800'
        }] : []),
        {
          icon: Key,
          label: 'Réinitialiser mot de passe',
          onClick: (row) => openModal('reset-password', row),
          className: 'text-purple-600 hover:text-purple-800'
        },
        ...(hasPermission('users:delete') ? [{
          icon: Trash2,
          label: 'Supprimer',
          onClick: (row) => openDeleteDialog(row),
          className: 'text-red-600 hover:text-red-800',
          disabled: (row) => row.id === currentUser?.id // Can't delete self
        }] : [])
      ]}
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((usersData?.total || 0) / pageSize)}
          totalItems={usersData?.total || 0}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      }
    />
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <span>Gestion des Utilisateurs</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les utilisateurs du système ETS RESELEC
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm text-gray-500">
              <p className="font-medium">{usersData?.total || 0} utilisateurs</p>
              <p>{usersData?.data?.filter(u => u.actif).length || 0} actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Liste des utilisateurs</h2>
          {hasPermission('users:create') && (
            <button 
              onClick={() => openModal('user')}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel utilisateur</span>
            </button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          
          <div className="flex space-x-3">
            <select 
              className="px-4 py-2 border rounded-lg"
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
              className="px-4 py-2 border rounded-lg"
              value={filters.actif || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                actif: e.target.value || undefined 
              }))}
            >
              <option value="">Tous les statuts</option>
              <option value="true">Actifs uniquement</option>
              <option value="false">Inactifs uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {renderUsersTable()}

      {/* Modal */}
      {renderModal()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.nom}" ? Cette action est irréversible et supprimera également toutes les données associées.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteUserMutation.isPending}
      />
    </div>
  );
};

export default Users;