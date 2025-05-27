
import React, { useState } from 'react';
import { Shield, Users, Edit, Trash2, Plus, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import SearchInput from '../common/SearchInput';
import PermissionMatrix from './PermissionMatrix';
import { roleService } from '../../services/roleService';
import toast from 'react-hot-toast';

const RoleList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Queries
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles', { page: currentPage, search: searchQuery }],
    queryFn: () => roleService.getAll({ page: currentPage, search: searchQuery })
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions()
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: roleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowModal(false);
      setSelectedRole(null);
      toast.success('Role created successfully');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowModal(false);
      setSelectedRole(null);
      toast.success('Role updated successfully');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted successfully');
    }
  });

  const openModal = (role = null) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleSubmit = (formData) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data: formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const columns = [
    { 
      key: 'nom', 
      header: 'Role Name',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: 'userCount', 
      header: 'Users',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{value || 0}</span>
        </div>
      )
    },
    { 
      key: 'permissions', 
      header: 'Permissions',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.slice(0, 3).map(permission => (
            <span key={permission.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {permission.module}:{permission.action}
            </span>
          ))}
          {value?.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{value.length - 3} more
            </span>
          )}
        </div>
      )
    }
  ];

  const actions = [
    {
      icon: Edit,
      label: 'Edit',
      onClick: (row) => openModal(row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: (row) => {
        if (window.confirm(`Delete role "${row.nom}"?`)) {
          deleteRoleMutation.mutate(row.id);
        }
      },
      className: 'text-red-600 hover:text-red-800',
      disabled: (row) => row.userCount > 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600">Manage system roles and permissions</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Role</span>
          </button>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search roles..."
          className="max-w-md"
        />
      </div>

      {/* Roles Table */}
      <DataTable
        data={rolesData?.data || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        emptyMessage="No roles found"
      />

      {/* Role Form Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedRole ? 'Edit Role' : 'Create New Role'}
          size="lg"
        >
          <RoleForm
            role={selectedRole}
            permissions={permissionsData?.permissionMatrix || {}}
            onSubmit={handleSubmit}
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

// Role Form Component
const RoleForm = ({ role, permissions, onSubmit, loading, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: role?.nom || '',
    permissions: role?.permissions?.map(p => p.id) || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role Name *
        </label>
        <input
          type="text"
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
          placeholder="Enter role name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Permissions
        </label>
        <PermissionMatrix
          permissions={permissions}
          selectedPermissions={formData.permissions}
          onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <span>{role ? 'Update Role' : 'Create Role'}</span>
        </button>
      </div>
    </form>
  );
};

export default RoleList;