import React, { useState } from 'react';
import { 
  Calendar, 
  Building, 
  Wrench, 
  Eye, 
  Edit, 
  MoreVertical, 
  AlertCircle,
  Play,
  Pause,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

// Utility function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Status Badge Component
const StatusBadge = ({ status, urgence, size = 'normal' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'PLANIFIEE': { 
        label: 'Planifiée', 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        dot: 'bg-blue-400'
      },
      'EN_ATTENTE_PDR': { 
        label: 'En attente PDR', 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        dot: 'bg-yellow-400'
      },
      'EN_COURS': { 
        label: 'En cours', 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        dot: 'bg-green-400'
      },
      'EN_PAUSE': { 
        label: 'En pause', 
        bg: 'bg-orange-100', 
        text: 'text-orange-800',
        dot: 'bg-orange-400'
      },
      'TERMINEE': { 
        label: 'Terminée', 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        dot: 'bg-gray-400'
      },
      'ANNULEE': { 
        label: 'Annulée', 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        dot: 'bg-red-400'
      },
      'ECHEC': { 
        label: 'Échec', 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        dot: 'bg-red-400'
      }
    };
    return configs[status] || configs['PLANIFIEE'];
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'small' ? 'px-2 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 ${config.dot} rounded-full mr-1.5`}></span>
      {config.label}
      {urgence && (
        <AlertCircle className="w-3 h-3 ml-1 text-red-600" />
      )}
    </span>
  );
};

// Individual Intervention Card Component
const InterventionCard = ({ 
  intervention, 
  onView, 
  onEdit, 
  onStatusUpdate,
  hasEditPermission,
  hasStatusUpdatePermission
}) => {
  const [showActions, setShowActions] = useState(false);

  const isOverdue = () => {
    const interventionDate = new Date(intervention.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return interventionDate < today && 
           ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE'].includes(intervention.statut);
  };

  const getStatusActions = () => {
    const { statut } = intervention;
    const actions = [];

    switch (statut) {
      case 'PLANIFIEE':
        actions.push(
          { label: 'Démarrer', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Mettre en attente', value: 'EN_ATTENTE_PDR', icon: Clock, color: 'text-yellow-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_ATTENTE_PDR':
        actions.push(
          { label: 'Démarrer', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_COURS':
        actions.push(
          { label: 'Mettre en pause', value: 'EN_PAUSE', icon: Pause, color: 'text-yellow-600' },
          { label: 'Terminer', value: 'TERMINEE', icon: CheckCircle, color: 'text-green-600' },
          { label: 'Marquer comme échec', value: 'ECHEC', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_PAUSE':
        actions.push(
          { label: 'Reprendre', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'ECHEC':
        actions.push(
          { label: 'Reprendre', value: 'EN_COURS', icon: Play, color: 'text-green-600' }
        );
        break;
      default:
        break;
    }

    return actions;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
      isOverdue() ? 'border-red-200 bg-red-50' : ''
    }`}>
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {formatDate(intervention.date)}
              </span>
              {isOverdue() && (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  En retard
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {intervention.equipement?.nom || 'Équipement non défini'}
            </h3>
            
            <div className="flex items-center text-sm text-gray-500">
              <Building className="w-4 h-4 mr-1" />
              <span>{intervention.equipement?.proprietaire?.nom_entreprise || 'Client non défini'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {intervention.urgence && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <Wrench className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Statut:</span>
          <StatusBadge 
            status={intervention.statut} 
            urgence={intervention.urgence}
            size="small"
          />
        </div>

        {/* Description */}
        {intervention.description && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">Description:</span>
            <p className="text-sm text-gray-600 line-clamp-3">
              {intervention.description}
            </p>
          </div>
        )}

        {/* Creator */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Créé par:</span>
          <span className="text-sm text-gray-900">{intervention.creerPar?.nom || 'N/A'}</span>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Priorité:</span>
          {intervention.urgence ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Urgent
            </span>
          ) : (
            <span className="text-sm text-gray-500">Normal</span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onView(intervention)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>Voir détails</span>
          </button>
          
          <div className="flex items-center space-x-2">
            {hasEditPermission && (
              <button
                onClick={() => onEdit(intervention)}
                className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {hasStatusUpdatePermission && getStatusActions().length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActions(false)}
                    ></div>
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        {getStatusActions().map((action, index) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                onStatusUpdate(intervention.id, action.value);
                                setShowActions(false);
                              }}
                              className={`flex items-center w-full px-4 py-2 text-sm ${action.color} hover:bg-gray-100 text-left`}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Intervention Cards Grid Component
const InterventionCards = ({ 
  interventions, 
  onView, 
  onEdit, 
  onStatusUpdate,
  hasEditPermission,
  hasStatusUpdatePermission
}) => {
  if (interventions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune intervention trouvée
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche ou créez une nouvelle intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interventions.map((intervention) => (
        <InterventionCard
          key={intervention.id}
          intervention={intervention}
          onView={onView}
          onEdit={onEdit}
          onStatusUpdate={onStatusUpdate}
          hasEditPermission={hasEditPermission}
          hasStatusUpdatePermission={hasStatusUpdatePermission}
        />
      ))}
    </div>
  );
};

// Intervention Table Component
const InterventionTable = ({ 
  interventions, 
  onSort, 
  sortBy, 
  sortOrder, 
  onView, 
  onEdit, 
  onStatusUpdate,
  hasEditPermission,
  hasStatusUpdatePermission
}) => {
  const [actionMenus, setActionMenus] = useState({});

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'ASC' ? '↑' : '↓';
  };

  const SortableHeader = ({ column, children, className = '' }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <span className="text-gray-400">{getSortIcon(column)}</span>
      </div>
    </th>
  );

  const toggleActionMenu = (interventionId) => {
    setActionMenus(prev => ({
      ...prev,
      [interventionId]: !prev[interventionId]
    }));
  };

  const getStatusActions = (intervention) => {
    const { statut } = intervention;
    const actions = [];

    switch (statut) {
      case 'PLANIFIEE':
        actions.push(
          { label: 'Démarrer', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Mettre en attente', value: 'EN_ATTENTE_PDR', icon: Clock, color: 'text-yellow-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_ATTENTE_PDR':
        actions.push(
          { label: 'Démarrer', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_COURS':
        actions.push(
          { label: 'Mettre en pause', value: 'EN_PAUSE', icon: Pause, color: 'text-yellow-600' },
          { label: 'Terminer', value: 'TERMINEE', icon: CheckCircle, color: 'text-green-600' },
          { label: 'Marquer comme échec', value: 'ECHEC', icon: X, color: 'text-red-600' }
        );
        break;
      case 'EN_PAUSE':
        actions.push(
          { label: 'Reprendre', value: 'EN_COURS', icon: Play, color: 'text-green-600' },
          { label: 'Annuler', value: 'ANNULEE', icon: X, color: 'text-red-600' }
        );
        break;
      case 'ECHEC':
        actions.push(
          { label: 'Reprendre', value: 'EN_COURS', icon: Play, color: 'text-green-600' }
        );
        break;
      default:
        break;
    }

    return actions;
  };

  const isOverdue = (intervention) => {
    const interventionDate = new Date(intervention.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return interventionDate < today && 
           ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE'].includes(intervention.statut);
  };

  if (interventions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune intervention trouvée
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche ou créez une nouvelle intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader column="date">Date</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Équipement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <SortableHeader column="statut">Statut</SortableHeader>
              <SortableHeader column="urgence">Priorité</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé par
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interventions.map((intervention) => (
              <tr 
                key={intervention.id} 
                className={`hover:bg-gray-50 ${isOverdue(intervention) ? 'bg-red-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(intervention.date)}
                      </div>
                      {isOverdue(intervention) && (
                        <div className="text-xs text-red-600 font-medium">
                          En retard
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <Wrench className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {intervention.equipement?.nom || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {intervention.equipement?.proprietaire?.nom_entreprise || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {intervention.description || 'Aucune description'}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    status={intervention.statut} 
                    urgence={intervention.urgence}
                  />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {intervention.urgence ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Urgent
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Normal</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {intervention.creerPar?.nom || 'N/A'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(intervention)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {hasEditPermission && (
                      <button
                        onClick={() => onEdit(intervention)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {hasStatusUpdatePermission && getStatusActions(intervention).length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => toggleActionMenu(intervention.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionMenus[intervention.id] && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionMenus(prev => ({ ...prev, [intervention.id]: false }))}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                              <div className="py-1">
                                {getStatusActions(intervention).map((action, index) => {
                                  const Icon = action.icon;
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        onStatusUpdate(intervention.id, action.value);
                                        setActionMenus(prev => ({ ...prev, [intervention.id]: false }));
                                      }}
                                      className={`flex items-center w-full px-4 py-2 text-sm ${action.color} hover:bg-gray-100 text-left`}
                                    >
                                      <Icon className="w-4 h-4 mr-2" />
                                      {action.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Container Component
const InterventionList = ({ 
  interventions = [],
  viewMode = 'cards', // 'cards' or 'table'
  onSort,
  sortBy,
  sortOrder,
  onView,
  onEdit,
  onStatusUpdate,
  hasEditPermission = false,
  hasStatusUpdatePermission = false
}) => {
  const commonProps = {
    interventions,
    onView,
    onEdit,
    onStatusUpdate,
    hasEditPermission,
    hasStatusUpdatePermission
  };

  if (viewMode === 'table') {
    return (
      <InterventionTable
        {...commonProps}
        onSort={onSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    );
  }

  return <InterventionCards {...commonProps} />;
};

// Export all components
export {
  InterventionList,
  InterventionTable,
  InterventionCards,
  InterventionCard,
  StatusBadge
};

export default InterventionList;