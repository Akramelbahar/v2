// src/components/interventions/InterventionCard.jsx
import React from 'react';
import { 
  Calendar, Clock, AlertTriangle, User, Building, Package, 
  Eye, Edit, Trash2, MoreVertical, CheckCircle, XCircle,
  Pause, Play, RefreshCw
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatDateTimeShort } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';

const InterventionCard = ({ 
  intervention, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusChange,
  className = '' 
}) => {
  // Calculate days since creation
  const daysSince = Math.floor(
    (new Date() - new Date(intervention.date)) / (1000 * 60 * 60 * 24)
  );

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITIQUE': return 'text-red-600 bg-red-100';
      case 'HAUTE': return 'text-orange-600 bg-orange-100';
      case 'NORMALE': return 'text-blue-600 bg-blue-100';
      case 'BASSE': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'MAINTENANCE': return 'text-green-600 bg-green-100';
      case 'RENOVATION': return 'text-purple-600 bg-purple-100';
      case 'REPARATION': return 'text-red-600 bg-red-100';
      case 'INSTALLATION': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLANIFIEE': return <Clock className="w-4 h-4" />;
      case 'EN_COURS': return <Play className="w-4 h-4" />;
      case 'EN_PAUSE': return <Pause className="w-4 h-4" />;
      case 'TERMINEE': return <CheckCircle className="w-4 h-4" />;
      case 'ANNULEE': return <XCircle className="w-4 h-4" />;
      case 'ECHEC': return <XCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              intervention.urgence ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {intervention.urgence ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                getStatusIcon(intervention.statut)
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">#{intervention.id}</h3>
                {intervention.urgence && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                    URGENT
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {intervention.equipement?.nom || 'Équipement non spécifié'}
              </p>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="flex items-center space-x-1">
            {onView && (
              <button
                onClick={() => onView(intervention)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Voir les détails"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(intervention)}
                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(intervention)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Equipment and Client Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>{intervention.equipement?.marque} {intervention.equipement?.modele}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span className="truncate">
              {intervention.equipement?.proprietaire?.nom_entreprise || 'Client non spécifié'}
            </span>
          </div>
        </div>

        {/* Description */}
        {intervention.description && (
          <div className="text-sm text-gray-700">
            <p className="line-clamp-2">
              {intervention.description}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {/* Type */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            getTypeColor(intervention.type_intervention)
          }`}>
            {intervention.type_intervention?.toLowerCase() || 'Non spécifié'}
          </span>
          
          {/* Priority */}
          {intervention.priorite && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              getPriorityColor(intervention.priorite)
            }`}>
              {intervention.priorite.toLowerCase()}
            </span>
          )}
          
          {/* Status */}
          <StatusBadge 
            status={intervention.statut} 
            urgence={intervention.urgence}
            size="small"
          />
        </div>

        {/* Timeline Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <div>
              <p className="font-medium">Date planifiée</p>
              <p>{formatDate(intervention.date)}</p>
            </div>
          </div>
          
          {intervention.duree_estimee && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <div>
                <p className="font-medium">Durée estimée</p>
                <p>{intervention.duree_estimee}h</p>
              </div>
            </div>
          )}
        </div>

        {/* Cost and Creator */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {intervention.cout_estime ? (
              <span className="font-medium text-gray-900">
                {formatCurrency(intervention.cout_estime)}
              </span>
            ) : (
              <span className="text-gray-500">Coût non estimé</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <User className="w-4 h-4" />
            <span>{intervention.creerPar?.nom || 'Créateur inconnu'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>
              Créé {formatDateTimeShort(intervention.createdAt || intervention.date)}
            </span>
            {daysSince > 0 && (
              <span>
                {daysSince === 1 ? 'Il y a 1 jour' : `Il y a ${daysSince} jours`}
              </span>
            )}
          </div>
          
          {/* Progress indicator for workflow */}
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {/* Diagnostic */}
              <div className={`w-2 h-2 rounded-full ${
                ['EN_ATTENTE_PDR', 'EN_COURS', 'TERMINEE'].includes(intervention.statut) 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
              {/* Planification */}
              <div className={`w-2 h-2 rounded-full ${
                ['EN_COURS', 'TERMINEE'].includes(intervention.statut) 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
              {/* Contrôle Qualité */}
              <div className={`w-2 h-2 rounded-full ${
                intervention.statut === 'TERMINEE' 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
            </div>
            <span className="ml-2 text-xs">
              {intervention.statut === 'TERMINEE' ? '3/3' : 
               intervention.statut === 'EN_COURS' ? '2/3' :
               ['EN_ATTENTE_PDR'].includes(intervention.statut) ? '1/3' : '0/3'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionCard;