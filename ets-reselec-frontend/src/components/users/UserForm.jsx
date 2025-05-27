

// 8. User Form Component
// ets-reselec-frontend/src/components/users/UserForm.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const UserForm = ({ user, roles, onSubmit, loading, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    username: user?.username || '',
    password: '',
    section: user?.section || '',
    role_id: user?.role?.id || ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Don't send empty password for updates
    if (user && !submitData.password) {
      delete submitData.password;
    }
    
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="Enter username"
            disabled={!!user} // Disable editing username for existing users
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password {!user && '*'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required={!user}
              className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={user ? "Leave empty to keep current password" : "Enter password"}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.section}
            onChange={(e) => handleChange('section', e.target.value)}
            placeholder="Enter section/department"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.role_id}
            onChange={(e) => handleChange('role_id', e.target.value)}
          >
            <option value="">Select a role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
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
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <span>{user ? 'Update User' : 'Create User'}</span>
        </button>
      </div>
    </form>
  );
};

export default UserForm;