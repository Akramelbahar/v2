// src/components/common/ConfirmDialog.jsx
import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ?",
  type = 'warning', // warning, danger, info, success
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  loading = false
}) => {
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      confirmButtonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    danger: {
      icon: X,
      iconColor: 'text-red-600',
      confirmButtonColor: 'bg-red-600 hover:bg-red-700'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      confirmButtonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      confirmButtonColor: 'bg-green-600 hover:bg-green-700'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
    >
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            disabled={loading}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            className={`
              flex-1 rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
              ${config.confirmButtonColor}
            `}
            onClick={onConfirm}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {confirmText}
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;