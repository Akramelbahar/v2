// src/components/workflow/WorkflowPipeline.jsx
import React from 'react';
import { 
  Search, Settings, CheckCircle, Clock, AlertTriangle, 
  ArrowRight, Play, Pause, Target, FileCheck
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const WorkflowPipeline = ({ 
  intervention, 
  workflow, 
  onPhaseClick, 
  showDetails = true,
  compact = false 
}) => {
  // Define workflow phases
  const phases = [
    {
      id: 'diagnostic',
      name: 'Diagnostic',
      icon: Search,
      description: 'Analyse et diagnostic',
      color: 'blue'
    },
    {
      id: 'planification',
      name: 'Planification',
      icon: Settings,
      description: 'Planning et ressources',
      color: 'orange'
    },
    {
      id: 'controleQualite',
      name: 'Contrôle Qualité',
      icon: Target,
      description: 'Tests et validation',
      color: 'green'
    }
  ];

  // Get phase status
  const getPhaseStatus = (phaseId) => {
    if (!workflow?.phases) return 'pending';
    
    const phase = workflow.phases[phaseId];
    if (!phase) return 'pending';
    
    if (phase.completed) return 'completed';
    
    // Check if this is the active phase
    const currentPhaseIndex = getCurrentPhaseIndex();
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    
    if (phaseIndex === currentPhaseIndex) return 'active';
    if (phaseIndex < currentPhaseIndex) return 'completed';
    
    return 'pending';
  };

  // Get current active phase index
  const getCurrentPhaseIndex = () => {
    if (!intervention?.statut) return 0;
    
    switch (intervention.statut) {
      case 'PLANIFIEE': return 0; // Diagnostic phase
      case 'EN_ATTENTE_PDR': return 1; // Planification phase
      case 'EN_COURS': return 2; // Contrôle Qualité phase
      case 'TERMINEE': return 3; // All completed
      default: return 0;
    }
  };

  // Get phase colors based on status
  const getPhaseColors = (status, baseColor) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          icon: 'text-green-600',
          text: 'text-green-800'
        };
      case 'active':
        return {
          bg: `bg-${baseColor}-100`,
          border: `border-${baseColor}-300`,
          icon: `text-${baseColor}-600`,
          text: `text-${baseColor}-800`
        };
      case 'pending':
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          icon: 'text-gray-400',
          text: 'text-gray-600'
        };
    }
  };

  // Get connector color
  const getConnectorColor = (fromIndex, toIndex) => {
    const currentIndex = getCurrentPhaseIndex();
    if (fromIndex < currentIndex) return 'bg-green-500';
    return 'bg-gray-300';
  };

  // Calculate completion percentage
  const completionPercentage = () => {
    const currentIndex = getCurrentPhaseIndex();
    return Math.min(100, (currentIndex / phases.length) * 100);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const Icon = phase.icon;
          
          return (
            <div key={phase.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  status === 'completed' ? 'bg-green-100 border-green-300' :
                  status === 'active' ? `bg-${phase.color}-100 border-${phase.color}-300` :
                  'bg-gray-100 border-gray-300'
                }`}
                title={phase.name}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Icon className={`w-4 h-4 ${
                    status === 'active' ? `text-${phase.color}-600` : 'text-gray-400'
                  }`} />
                )}
              </div>
              
              {index < phases.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  getConnectorColor(index, index + 1)
                }`}></div>
              )}
            </div>
          );
        })}
        
        <div className="ml-3 text-sm text-gray-600">
          {Math.round(completionPercentage())}%
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Workflow d'Intervention</h3>
          <p className="text-sm text-gray-600">
            Suivi des phases de l'intervention #{intervention?.id}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(completionPercentage())}%
          </div>
          <div className="text-sm text-gray-500">Complété</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Phases */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const colors = getPhaseColors(status, phase.color);
            const Icon = phase.icon;
            const phaseData = workflow?.phases?.[phase.id];
            
            return (
              <div key={phase.id} className="flex flex-col items-center flex-1">
                {/* Phase circle */}
                <div 
                  className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${colors.bg} ${colors.border}`}
                  onClick={() => onPhaseClick && onPhaseClick(phase.id, phaseData)}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : status === 'active' ? (
                    <div className="relative">
                      <Icon className={`w-8 h-8 ${colors.icon}`} />
                      {/* Pulse animation for active phase */}
                      <div className="absolute inset-0 w-8 h-8 rounded-full animate-ping bg-current opacity-20"></div>
                    </div>
                  ) : (
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  )}
                  
                  {/* Status indicator */}
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'active' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}></div>
                </div>
                
                {/* Phase info */}
                <div className="mt-4 text-center">
                  <h4 className={`font-medium ${colors.text}`}>
                    {phase.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {phase.description}
                  </p>
                  
                  {/* Phase details */}
                  {showDetails && phaseData && (
                    <div className="mt-2 text-xs text-gray-600">
                      {phaseData.dateCreation && (
                        <p>Créé: {formatDate(phaseData.dateCreation)}</p>
                      )}
                      {phaseData.dateControle && (
                        <p>Contrôlé: {formatDate(phaseData.dateControle)}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Connector line */}
                {index < phases.length - 1 && (
                  <div className="absolute top-8 left-1/2 transform -translate-y-1/2" 
                       style={{ 
                         left: `${((index + 1) / phases.length) * 100 - (100 / phases.length / 2)}%`,
                         width: `${100 / phases.length}%`
                       }}>
                    <div className={`h-0.5 ${getConnectorColor(index, index + 1)} relative`}>
                      <ArrowRight className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        getConnectorColor(index, index + 1) === 'bg-green-500' ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Actions */}
      {workflow?.nextActions && workflow.nextActions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Play className="w-4 h-4 text-blue-600" />
            <span>Actions Suivantes</span>
          </h4>
          <div className="space-y-2">
            {workflow.nextActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status timeline */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span>Historique</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Intervention créée</span>
              <span className="text-gray-500">
                {formatDate(intervention?.date)}
              </span>
            </div>
            
            {workflow?.phases?.diagnostic?.completed && (
              <div className="flex items-center justify-between py-1">
                <span className="text-green-600">Diagnostic complété</span>
                <span className="text-gray-500">
                  {formatDate(workflow.phases.diagnostic.dateCreation)}
                </span>
              </div>
            )}
            
            {workflow?.phases?.planification?.completed && (
              <div className="flex items-center justify-between py-1">
                <span className="text-orange-600">Planification complétée</span>
                <span className="text-gray-500">
                  {formatDate(workflow.phases.planification.dateCreation)}
                </span>
              </div>
            )}
            
            {workflow?.phases?.controleQualite?.completed && (
              <div className="flex items-center justify-between py-1">
                <span className="text-green-600">Contrôle Qualité complété</span>
                <span className="text-gray-500">
                  {formatDate(workflow.phases.controleQualite.dateControle)}
                </span>
              </div>
            )}
            
            {intervention?.statut === 'TERMINEE' && (
              <div className="flex items-center justify-between py-1">
                <span className="text-green-600 font-medium">Intervention terminée</span>
                <span className="text-gray-500">
                  {formatDate(intervention.updatedAt || intervention.date)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowPipeline;