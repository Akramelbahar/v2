
// 13. Bulk Operations Component
// ets-reselec-frontend/src/components/bulk/BulkOperations.jsx
import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Edit, Download, Upload } from 'lucide-react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';

const BulkOperations = ({ 
  data = [], 
  selectedItems = [], 
  onSelectionChange, 
  onBulkAction,
  availableActions = []
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(item => item.id));
    }
  };

  const handleItemSelect = (itemId) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleBulkAction = (action) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      onBulkAction(action.key, selectedItems);
    }
  };

  const confirmBulkAction = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.key, selectedItems);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="bg-white border-b">
      {/* Selection Controls */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className={`w-4 h-4 ${isIndeterminate ? 'text-blue-600' : ''}`} />
            )}
            <span>
              {selectedItems.length > 0 
                ? `${selectedItems.length} selected` 
                : 'Select all'
              }
            </span>
          </button>

          {selectedItems.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedItems.length} of {data.length} items selected
            </span>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            {availableActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleBulkAction(action)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center space-x-1 ${action.className || 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Item Selection */}
      <div className="divide-y">
        {data.map(item => (
          <div key={item.id} className="px-6 py-3 flex items-center hover:bg-gray-50">
            <button
              onClick={() => handleItemSelect(item.id)}
              className="mr-4"
            >
              {selectedItems.includes(item.id) ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <div className="flex-1">
              {/* Render item content here */}
              <div className="font-medium text-gray-900">{item.name || item.nom}</div>
              <div className="text-sm text-gray-500">{item.description || item.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmBulkAction}
        title={`Confirm ${pendingAction?.label}`}
        message={`Are you sure you want to ${pendingAction?.label.toLowerCase()} ${selectedItems.length} selected items?`}
        type={pendingAction?.type || 'warning'}
      />
    </div>
  );
};

// Default bulk actions
export const DEFAULT_BULK_ACTIONS = [
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    className: 'bg-red-100 text-red-700 hover:bg-red-200',
    requiresConfirmation: true,
    type: 'danger'
  },
  {
    key: 'export',
    label: 'Export',
    icon: Download,
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
  }
];

export default BulkOperations;
