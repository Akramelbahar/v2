

// 9. User Role Assignment Component
// ets-reselec-frontend/src/components/users/UserRoleAssignment.jsx
import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';

const UserRoleAssignment = ({ user, roles, onSubmit, loading, onCancel }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(user?.role?.id || '');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      userId: user.id,
      roleId: selectedRoleId,
      reason: reason.trim()
    });
  };

  const selectedRole = roles.find(r => r.id.toString() === selectedRoleId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.nom}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
            <div className="text-sm text-gray-500">
              Current Role: {user.role?.nom || 'No role assigned'}
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Role *
        </label>
        <select
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
        >
          <option value="">Select a role</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.nom}</option>
          ))}
        </select>
      </div>

      {/* Role Permissions Preview */}
      {selectedRole && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Role Permissions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRole.permissions?.map(permission => (
              <span key={permission.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {permission.module}:{permission.action}
              </span>
            ))}
            {!selectedRole.permissions?.length && (
              <span className="text-blue-700 text-sm">No specific permissions</span>
            )}
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Role Change
        </label>
        <textarea
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this role change is necessary..."
        />
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Important:</p>
            <p>
              Changing a user's role will immediately affect their access permissions. 
              Make sure this change is authorized and necessary.
            </p>
          </div>
        </div>
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
          disabled={loading || !selectedRoleId}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <span>Assign Role</span>
        </button>
      </div>
    </form>
  );
};

export default UserRoleAssignment;
