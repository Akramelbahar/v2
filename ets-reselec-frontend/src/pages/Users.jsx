import React, { useState } from 'react';
import { 
  UserCheck, Plus, Search, Edit, Trash2, Eye, Shield, Settings, 
  AlertCircle, CheckCircle, Clock, Users as UsersIcon, Filter,
  MoreVertical, UserPlus, UserX, Key
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Components
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

// API functions
const userAPI = {
  getAll: (params) => api.get('/admin/users', { params }).then(res => res.data),
  getById: (id) => api.get(`/admin/users/${id}`).then(res => res.data),
  create: (data) => api.post('/admin/users', data).then(res => res.data),
  update: (id, data) => api.put(`/admin/users/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/admin/users/${id}`).then(res => res.data),
  updateStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }).then(res => res.data),
  getStats: () => api.get('/admin/users/stats').then(res => res.data)
};

const roleAPI = {
  getAll: () => api.get('/admin/roles').then(res => res.data)
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Queries
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', { page: currentPage, limit: pageSize, search: searchQuery, ...filters }],
    queryFn: () => userAPI.getAll({ page: currentPage, limit: pageSize, search: searchQuery, ...filters })
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: roleAPI.getAll
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: userAPI.getStats
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: userAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['user-stats']);
      setShowModal(false);
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowModal(false);
      toast.success('Utilisateur modifié avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: userAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['user-stats']);
      setShowDeleteDialog(false);
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => userAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
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

  const handleDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleStatusChange = (user, newStatus) => {
    updateStatusMutation.mutate({ id: user.id, status: newStatus });
  };

  // User Form Component
  const UserForm = ({ user, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: user?.nom || '',
      username: user?.username || '',
      password: user ? '' : '',
      section: user?.section || '',
      role_id: user?.roleId || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password; // Don't update password if empty
      }
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              required
              disabled={!!user} // Cannot change username
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
            </label>
            <input
              type="password"
              required={!user}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={user ? 'Laisser vide pour ne pas changer' : ''}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.section}
              onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.role_id}
              onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
            >
              <option value="">Sélectionner un rôle</option>
              {rolesData?.data?.map(role => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </div>
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
            <span>{user ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // User Detail Component
  const UserDetail = ({ user }) => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user.nom}</h3>
            <p className="text-gray-600">@{user.username}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">{user.role || 'Aucun rôle'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Section</label>
          <p className="mt-1 text-sm text-gray-900">{user.section || 'Non définie'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Permissions</label>
          <div className="mt-1">
            {user.permissions && user.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {user.permissions.slice(0, 5).map((permission, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {permission}
                  </span>
                ))}
                {user.permissions.length > 5 && (
                  <span className="text-xs text-gray-500">+{user.permissions.length - 5} autres</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune permission</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Statistics Cards
  const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {loading ? (
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-16"></div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <UserCheck className="w-6 h-6" />
              <span>Gestion des Utilisateurs</span>
            </h1>
            <p className="text-gray-600 mt-1">Gérez les utilisateurs et leurs accès au système</p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Utilisateurs"
          value={statsData?.data?.totalUsers || 0}
          icon={UsersIcon}
          color="text-blue-600"
          loading={!statsData}
        />
        <StatCard
          title="Utilisateurs Actifs"
          value={statsData?.data?.activeUsers || 0}
          icon={CheckCircle}
          color="text-green-600"
          loading={!statsData}
        />
        <StatCard
          title="Utilisateurs Inactifs"
          value={statsData?.data?.inactiveUsers || 0}
          icon={Clock}
          color="text-yellow-600"
          loading={!statsData}
        />
        <StatCard
          title="Nouveaux (30j)"
          value={statsData?.data?.recentUsers || 0}
          icon={UserPlus}
          color="text-purple-600"
          loading={!statsData}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par nom, nom d'utilisateur..."
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.role || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value || undefined }))}
          >
            <option value="">Tous les rôles</option>
            {rolesData?.data?.map(role => (
              <option key={role.id} value={role.nom}>{role.nom}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.section || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value || undefined }))}
          >
            <option value="">Toutes les sections</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Technique">Technique</option>
            <option value="Administration">Administration</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={usersData?.data || []}
        loading={isLoading}
        columns={[
          {
            key: 'nom',
            header: 'Utilisateur',
            render: (value, row) => (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium">{value}</div>
                  <div className="text-sm text-gray-500">@{row.username}</div>
                </div>
              </div>
            )
          },
          {
            key: 'role',
            header: 'Rôle',
            render: (value) => value ? (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {value}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">Aucun rôle</span>
            )
          },
          { key: 'section', header: 'Section' },
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
            key: 'status',
            header: 'Statut',
            render: (value = 'active') => (
              <StatusBadge
                status={value === 'active' ? 'TERMINEE' : 'EN_PAUSE'}
                urgence={false}
              />
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
            className: 'text-yellow-600 hover:text-yellow-800',
            disabled: (row) => row.id === currentUser?.id
          },
          {
            icon: Trash2,
            label: 'Supprimer',
            onClick: (row) => {
              setSelectedUser(row);
              setShowDeleteDialog(true);
            },
            className: 'text-red-600 hover:text-red-800',
            disabled: (row) => row.id === currentUser?.id
          }
        ]}
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((usersData?.total || 0) / pageSize)}
            totalItems={usersData?.total || 0}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            modalType === 'create' ? 'Nouvel Utilisateur' :
            modalType === 'edit' ? 'Modifier Utilisateur' :
            modalType === 'view' ? 'Détails Utilisateur' : ''
          }
          size={modalType === 'view' ? 'lg' : 'md'}
        >
          {modalType === 'view' ? (
            <UserDetail user={selectedUser} />
          ) : (
            <UserForm
              user={modalType === 'edit' ? selectedUser : null}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  updateUserMutation.mutate({ id: selectedUser.id, data });
                } else {
                  createUserMutation.mutate(data);
                }
              }}
              loading={createUserMutation.isPending || updateUserMutation.isPending}
            />
          )}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteUserMutation.isPending}
      />
    </div>
  );
};

export default Users;