
// 7. User Management Component
// ets-reselec-frontend/src/components/users/UserList.jsx
import React, { useState } from 'react';
import { UserCheck, Edit, Trash2, Plus, Shield, Building } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import SearchInput from '../common/SearchInput';
import UserForm from './UserForm';
import UserRoleAssignment from './UserRoleAssignment';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import toast from 'react-hot-toast';

const UserList = () => {
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Queries
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', { page: currentPage, search: searchQuery, ...filters }],
    queryFn: () => userService.getAll({ page: currentPage, search: searchQuery, ...filters })
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll({ limit: 100 })
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowModal(false);
      setSelectedUser(null);
      toast.success('User created successfully');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId, reason }) => userService.assignRole(userId, roleId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowRoleModal(false);
      setSelectedUser(null);
      toast.success('Role assigned successfully');
    }
  });

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    if (type === 'role') {
      setShowRoleModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = (formData) => {
    if (modalType === 'edit') {
      updateUserMutation.mutate({ id: selectedUser.id, data: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const columns = [
    { 
      key: 'nom', 
      header: 'User',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">@{row.username}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'Role',
      render: (value) => value ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3 mr-1" />
          {value.nom}
        </span>
      ) : (
        <span className="text-gray-400">No role assigned</span>
      )
    },
    { 
      key: 'section', 
      header: 'Section',
      render: (value, row) => (
        <div className="flex items-center space-x-1">
          <Building className="w-4 h-4 text-gray-400" />
          <span>{row.sectionBelongsTo?.nom || value || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: () => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      )
    }
  ];

  const actions = [
    {
      icon: Shield,
      label: 'Assign Role',
      onClick: (row) => openModal('role', row),
      className: 'text-purple-600 hover:text-purple-800'
    },
    {
      icon: Edit,
      label: 'Edit',
      onClick: (row) => openModal('edit', row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: (row) => {
        if (window.confirm(`Delete user "${row.nom}"?`)) {
          deleteUserMutation.mutate(row.id);
        }
      },
      className: 'text-red-600 hover:text-red-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New User</span>
          </button>
        </div>

        <div className="flex space-x-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users..."
            className="flex-1 max-w-md"
          />
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.role_id || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, role_id: e.target.value || undefined }))}
          >
            <option value="">All Roles</option>
            {rolesData?.data?.map(role => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={usersData?.data || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        emptyMessage="No users found"
      />

      {/* User Form Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalType === 'edit' ? 'Edit User' : 'Create New User'}
          size="lg"
        >
          <UserForm
            user={selectedUser}
            roles={rolesData?.data || []}
            onSubmit={handleSubmit}
            loading={createUserMutation.isPending || updateUserMutation.isPending}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Assign User Role"
          size="md"
        >
          <UserRoleAssignment
            user={selectedUser}
            roles={rolesData?.data || []}
            onSubmit={assignRoleMutation.mutate}
            loading={assignRoleMutation.isPending}
            onCancel={() => setShowRoleModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default UserList;