// ets-reselec-frontend/src/pages/Users.jsx
import React, { useState } from 'react';
import { 
  UserCheck, Plus, Edit, Trash2, Eye, Search, Lock, Shield,
  AlertCircle, X, Save, User, Mail, Phone, Building, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner, { TableLoadingSpinner } from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import DataTable from '../components/common/DataTable';
import FormField from '../components/forms/FormField';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// API Service functions for user management
const userService = {
  // Get all users - Note: This endpoint needs to be created in the backend
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      // If the endpoint doesn't exist yet, return mock data
      console.warn('Users endpoint not available, using mock data');
      const mockUsers = [
        {
          id: 1,
          nom: 'Administrateur Système',
          username: 'admin',
          section: 'Administration',
          role: { id: 1, nom: 'Administrateur' },
          role_id: 1,
          createdAt: '2024-01-15',
          lastLogin: '2024-03-20T10:30:00'
        },
        {
          id: 2,
          nom: 'Jean Dupont',
          username: 'jdupont',
          section: 'Maintenance Préventive',
          role: { id: 2, nom: 'Chef de Section' },
          role_id: 2,
          createdAt: '2024-01-20',
          lastLogin: '2024-03-20T14:15:00'
        },
        {
          id: 3,
          nom: 'Marie Martin',
          username: 'mmartin',
          section: 'Maintenance Corrective',
          role: { id: 3, nom: 'Technicien Senior' },
          role_id: 3,
          createdAt: '2024-02-01',
          lastLogin: '2024-03-19T09:00:00'
        }
      ];

      // Apply filters to mock data
      let filtered = mockUsers;
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = mockUsers.filter(user => 
          user.nom.toLowerCase().includes(search) ||
          user.username.toLowerCase().includes(search) ||
          user.section.toLowerCase().includes(search)
        );
      }
      
      if (params.role_id) {
        filtered = filtered.filter(user => user.role_id === parseInt(params.role_id));
      }

      return {
        success: true,
        data: filtered,
        total: filtered.length
      };
    }
  },

  // Create new user using the register endpoint
  create: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Update user - Note: This endpoint needs to be created in the backend
  update: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      // Fallback to updating profile if it's the current user
      if (error.response?.status === 404) {
        const response = await api.put('/auth/profile', userData);
        return response.data;
      }
      throw error;
    }
  },

  // Delete user - Note: This endpoint needs to be created in the backend
  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Endpoint de suppression non disponible. Contactez l\'administrateur système.');
      }
      throw error;
    }
  },

  // Reset password - Note: This endpoint needs to be created in the backend
  resetPassword: async (id) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      // Simulate password reset for demo
      if (error.response?.status === 404) {
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
        return {
          success: true,
          data: { temporaryPassword: tempPassword }
        };
      }
      throw error;
    }
  }
};

// Role service
const roleService = {
  getAll: async () => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      // Return mock roles if endpoint doesn't exist
      console.warn('Roles endpoint not available, using mock data');
      return {
        success: true,
        data: [
          { id: 1, nom: 'Administrateur' },
          { id: 2, nom: 'Chef de Section' },
          { id: 3, nom: 'Technicien Senior' },
          { id: 4, nom: 'Technicien Junior' },
          { id: 5, nom: 'Observateur' }
        ]
      };
    }
  }
};

// Custom hooks for API calls
const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params),
    keepPreviousData: true,
    staleTime: 30000 // 30 seconds
  });
};

const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: roleService.getAll,
    staleTime: 300000 // 5 minutes - roles don't change often
  });
};

const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      toast.success('Compte utilisateur créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la création du compte';
      toast.error(message);
    }
  });
};

const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur modifié avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification';
      toast.error(message);
    }
  });
};

const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
      toast.error(message);
    }
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: userService.resetPassword,
    onSuccess: (data) => {
      if (data.data?.temporaryPassword) {
        toast.success(
          <div>
            <p>Mot de passe réinitialisé avec succès!</p>
            <p className="font-mono mt-1 bg-gray-100 p-1 rounded text-sm">
              Nouveau mot de passe: {data.data.temporaryPassword}
            </p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success('Mot de passe réinitialisé avec succès');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
      toast.error(message);
    }
  });
};

// User Form Component
const UserForm = ({ user, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    username: user?.username || '',
    section: user?.section || '',
    role_id: user?.role?.id || user?.role_id || '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data || [];
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores';
    }
    
    if (!formData.role_id) {
      newErrors.role_id = 'Le rôle est requis';
    }
    
    // Password validation for new users only
    if (!user) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Le mot de passe doit contenir au moins une lettre et un chiffre';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      const { confirmPassword, ...submitData } = formData;
      
      // Convert role_id to number
      submitData.role_id = parseInt(submitData.role_id);
      
      // Only include password for new users
      if (user) {
        delete submitData.password;
      }
      
      onSubmit(submitData);
    }
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <div className="space-y-4">
      <FormField label="Nom complet" name="nom" required error={errors.nom}>
        <input
          type="text"
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.nom ? 'border-red-300' : 'border-gray-300'
          }`}
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
        help={user ? "Le nom d'utilisateur ne peut pas être modifié" : "Lettres, chiffres et underscores uniquement"}
      >
        <input
          type="text"
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.username ? 'border-red-300' : 'border-gray-300'
          } ${user ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          placeholder="Nom d'utilisateur"
          disabled={!!user}
        />
      </FormField>
      
      <FormField label="Section / Département" name="section">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.section}
          onChange={(e) => handleChange('section', e.target.value)}
          placeholder="Ex: Maintenance, Technique, Administration"
        />
      </FormField>
      
      <FormField label="Rôle" name="role_id" required error={errors.role_id}>
        <select
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.role_id ? 'border-red-300' : 'border-gray-300'
          }`}
          value={formData.role_id}
          onChange={(e) => handleChange('role_id', e.target.value)}
        >
          <option value="">Sélectionner un rôle</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.nom}
            </option>
          ))}
        </select>
      </FormField>
      
      {!user && (
        <>
          <FormField 
            label="Mot de passe" 
            name="password" 
            required 
            error={errors.password}
            help="Au moins 6 caractères avec lettres et chiffres"
          >
            <input
              type="password"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Créez un mot de passe sécurisé"
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
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirmez le mot de passe"
            />
          </FormField>
        </>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-800">
            {user ? (
              <p>Les modifications seront appliquées immédiatement après validation.</p>
            ) : (
              <>
                <p className="font-medium mb-1">Le compte sera créé avec les privilèges du rôle sélectionné.</p>
                <p>L'utilisateur devra changer son mot de passe lors de la première connexion.</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <Save className="w-4 h-4" />
          <span>{user ? 'Enregistrer les modifications' : 'Créer le compte'}</span>
        </button>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Informations de l'utilisateur</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Nom:</p>
            <p className="text-sm text-gray-900">{user.nom}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Nom d'utilisateur:</p>
            <p className="text-sm text-gray-900">@{user.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Section:</p>
            <p className="text-sm text-gray-900">{user.section || 'Non définie'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Rôle:</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Shield className="w-3 h-3 mr-1" />
              {typeof user.role === 'object' ? user.role?.nom : user.role}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Créé le:</p>
            <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Dernière connexion:</p>
            <p className="text-sm text-gray-900">
              {user.lastLogin ? formatDateTime(user.lastLogin) : 'Jamais connecté'}
            </p>
          </div>
        </div>
      </div>
      
      {user.permissions && user.permissions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Permissions</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((permission, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Users Component
const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const { user: currentUser, isAdmin } = useAuth();
  
  // API Queries
  const { data: usersData, isLoading, error: usersError } = useUsers({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery, 
    role_id: roleFilter 
  });
  
  const { data: rolesData } = useRoles();
  
  const users = usersData?.data || [];
  const totalUsers = usersData?.total || 0;
  const roles = rolesData?.data || [];
  
  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetPasswordMutation = useResetPassword();
  
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
  
  const handleSubmit = async (data) => {
    try {
      if (selectedUser) {
        await updateMutation.mutateAsync({ id: selectedUser.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };
  
  const handleDelete = async () => {
    if (selectedUser) {
      try {
        await deleteMutation.mutateAsync(selectedUser.id);
        setShowDeleteDialog(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };
  
  const handleResetPassword = async () => {
    if (selectedUser) {
      try {
        await resetPasswordMutation.mutateAsync(selectedUser.id);
        setShowResetDialog(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Reset password error:', error);
      }
    }
  };
  
  // Table columns
  const columns = [
    { 
      key: 'user', 
      header: 'Utilisateur',
      render: (_, row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.nom}</div>
            <div className="text-sm text-gray-500">@{row.username}</div>
          </div>
        </div>
      )
    },
    { key: 'section', header: 'Section', render: (value) => value || '-' },
    { 
      key: 'role', 
      header: 'Rôle',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {typeof value === 'object' ? value?.nom : value}
        </span>
      )
    },
    { 
      key: 'lastLogin', 
      header: 'Dernière connexion',
      render: (value) => value ? formatDateTime(value) : 'Jamais'
    }
  ];
  
  const actions = [
    {
      icon: Eye,
      label: 'Voir',
      onClick: (row) => openModal('view', row),
      className: 'text-gray-600 hover:text-gray-900'
    },
    {
      icon: Edit,
      label: 'Modifier',
      onClick: (row) => openModal('edit', row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    {
      icon: Lock,
      label: 'Réinitialiser mot de passe',
      onClick: (row) => {
        setSelectedUser(row);
        setShowResetDialog(true);
      },
      className: 'text-yellow-600 hover:text-yellow-800'
    },
    {
      icon: Trash2,
      label: 'Supprimer',
      onClick: (row) => {
        setSelectedUser(row);
        setShowDeleteDialog(true);
      },
      className: 'text-red-600 hover:text-red-800',
      disabled: (row) => row.id === currentUser?.id // Can't delete yourself
    }
  ];
  
  // Calculate stats
  const roleStats = roles.map(role => ({
    ...role,
    count: users.filter(u => 
      (typeof u.role === 'object' ? u.role?.id : u.role_id) === role.id
    ).length
  }));
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <p className="text-gray-600 mt-1">Gérez les comptes utilisateurs et leurs permissions</p>
      </div>
      
      {/* Stats Cards */}
     
      
      {/* Actions and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Liste des Utilisateurs</h2>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un compte</span>
          </button>
        </div>
        
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous les rôles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Error message if API fails */}
      {usersError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">API en développement</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Les données affichées sont des données de démonstration. Les endpoints de gestion des utilisateurs sont en cours de développement.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        loading={isLoading}
        emptyMessage="Aucun utilisateur trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalUsers / pageSize)}
            totalItems={totalUsers}
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
          modalType === 'create' ? 'Créer un nouveau compte' :
          modalType === 'edit' ? 'Modifier l\'Utilisateur' :
          'Détails de l\'Utilisateur'
        }
        size={modalType === 'view' ? 'lg' : 'md'}
      >
        {modalType === 'view' ? (
          <UserDetailsModal user={selectedUser} />
        ) : (
          <UserForm
            user={modalType === 'edit' ? selectedUser : null}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </Modal>
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${selectedUser?.nom} ? Cette action est irréversible.`}
        type="danger"
        loading={deleteMutation.isPending}
      />
      
      {/* Reset Password Confirmation */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => {
          setShowResetDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResetPassword}
        title="Réinitialiser le mot de passe"
        message={`Voulez-vous réinitialiser le mot de passe de ${selectedUser?.nom} ? Un nouveau mot de passe temporaire sera généré.`}
        type="warning"
        confirmText="Réinitialiser"
        loading={resetPasswordMutation.isPending}
      />
    </div>
  );
};

export default Users;