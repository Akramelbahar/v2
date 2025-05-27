// 6. Permission Matrix Component
// ets-reselec-frontend/src/components/roles/PermissionMatrix.jsx
import React from 'react';
import { Check, X } from 'lucide-react';

const PermissionMatrix = ({ permissions, selectedPermissions, onChange }) => {
  const handlePermissionToggle = (permissionId) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    onChange(newPermissions);
  };

  const handleModuleToggle = (modulePermissions) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all module permissions
      const newPermissions = selectedPermissions.filter(id => !modulePermissionIds.includes(id));
      onChange(newPermissions);
    } else {
      // Select all module permissions
      const newPermissions = [...new Set([...selectedPermissions, ...modulePermissionIds])];
      onChange(newPermissions);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-700">
          <div className="col-span-3">Module</div>
          <div className="col-span-2 text-center">Create</div>
          <div className="col-span-2 text-center">Read</div>
          <div className="col-span-2 text-center">Update</div>
          <div className="col-span-2 text-center">Delete</div>
          <div className="col-span-1 text-center">All</div>
        </div>
      </div>

      <div className="divide-y">
        {Object.entries(permissions).map(([module, modulePermissions]) => {
          const modulePermissionIds = modulePermissions.map(p => p.id);
          const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
          const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id));

          return (
            <div key={module} className="px-4 py-3 hover:bg-gray-50">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <span className="font-medium text-gray-900 capitalize">
                    {module.replace('_', ' ')}
                  </span>
                </div>

                {['create', 'read', 'update', 'delete'].map(action => {
                  const permission = modulePermissions.find(p => p.action === action);
                  const isSelected = permission && selectedPermissions.includes(permission.id);

                  return (
                    <div key={action} className="col-span-2 text-center">
                      {permission ? (
                        <button
                          type="button"
                          onClick={() => handlePermissionToggle(permission.id)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </div>
                  );
                })}

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleModuleToggle(modulePermissions)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : someSelected
                        ? 'bg-blue-200 border-blue-400 text-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {allSelected && <Check className="w-4 h-4" />}
                    {someSelected && !allSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionMatrix;
