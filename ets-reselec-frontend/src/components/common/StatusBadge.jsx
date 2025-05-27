// src/components/common/StatusBadge.jsx
import React from 'react';
import { 
  Clock, AlertCircle, CheckCircle, Pause, X, Play
} from 'lucide-react';

const StatusBadge = ({ status, urgence = false, size = 'default' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'EN_COURS': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Clock, 
        label: 'En Cours' 
      },
      'PLANIFIEE': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: AlertCircle, 
        label: 'Planifiée' 
      },
      'TERMINEE': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        label: 'Terminée' 
      },
      'EN_ATTENTE_PDR': { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Pause, 
        label: 'En Attente PDR' 
      },
      'ANNULEE': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: X, 
        label: 'Annulée' 
      },
      'ECHEC': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: X, 
        label: 'Échec' 
      },
      'EN_PAUSE': { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Pause, 
        label: 'En Pause' 
      }
    };
    return configs[status] || { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: AlertCircle, 
      label: status || 'Inconnu' 
    };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  return (
    <div className="flex items-center space-x-2">
      {urgence && (
        <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>URGENT</span>
        </span>
      )}
      <span className={`
        ${sizeClasses[size]} border rounded-full font-medium 
        flex items-center space-x-1 ${config.color}
      `}>
        <Icon className={iconSizes[size]} />
        <span>{config.label}</span>
      </span>
    </div>
  );
};

export default StatusBadge;