// src/components/workflow/WorkflowStatus.jsx
import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  PlayCircle, 
  PauseCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';

const WorkflowStatus = ({ 
  intervention, 
  workflow, 
  onAdvancePhase, 
  loading = false,
  compact = false 
}) => {
  const phases = [
    {
      id: 'diagnostic',
      label: 'Diagnostic',
      icon: AlertTriangle,
      description: 'Analyse des besoins et identification des travaux'
    },
    {
      id: 'planification',
      label: 'Planification',
      icon: Clock,
      description: 'Organisation des ressources et planning'
    },
    {
      id: 'controleQualite',
      label: 'Contrôle Qualité',
      icon: CheckCircle,
      description: 'Tests et validation des travaux'
    }
  ];

  const getPhaseStatus = (phaseId) => {
    if (!workflow?.phases) return 'pending';
    
    const phase = workflow.phases[phaseId];
    if (phase?.completed) return 'completed';
    
    // Check if this is the current active phase
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    const currentPhaseIndex = phases.findIndex(p => !workflow.phases[p.id]?.completed);
    
    if (phaseIndex === currentPhaseIndex) return 'active';
    return 'pending';
  };

  const getInterventionStatus = () => {
    if (!intervention?.statut) return { status: 'pending', color: 'gray' };
    
    const statusConfig = {
      'PLANIFIEE': { status: 'planned', color: 'blue', label: 'Planifiée' },
      'EN_ATTENTE_PDR': { status: 'waiting', color: 'orange', label: 'En Attente PDR' },
      'EN_COURS': { status: 'active', color: 'yellow', label: 'En Cours' },
      'EN_PAUSE': { status: 'paused', color: 'gray', label: 'En Pause' },
      'TERMINEE': { status: 'completed', color: 'green', label: 'Terminée' },
      'ANNULEE': { status: 'cancelled', color: 'red', label: 'Annulée' },
      'ECHEC': { status: 'failed', color: 'red', label: 'Échec' }
    };
    
    return statusConfig[intervention.statut] || { status: 'unknown', color: 'gray', label: intervention.statut };
  };

  const canAdvancePhase = (phaseId) => {
    if (loading) return false;
    
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    const currentPhaseIndex = phases.findIndex(p => !workflow?.phases?.[p.id]?.completed);
    
    return phaseIndex === currentPhaseIndex && intervention?.statut !== 'TERMINEE';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const Icon = phase.icon;
          
          return (
            <React.Fragment key={phase.id}>
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-colors
                ${status === 'completed' ? 'bg-green-500 text-white' : 
                  status === 'active' ? 'bg-blue-500 text-white' : 
                  'bg-gray-300 text-gray-600'}
              `}>
                <Icon className="w-4 h-4" />
              </div>
              {index < phases.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  const interventionStatusConfig = getInterventionStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Statut du Workflow
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              bg-${interventionStatusConfig.color}-100 text-${interventionStatusConfig.color}-800
            `}>
              {interventionStatusConfig.label}
            </span>
            {intervention?.urgence && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>URGENT</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {workflow ? Math.round((Object.values(workflow.phases).filter(p => p.completed).length / phases.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-500">Progression</div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const Icon = phase.icon;
          const phaseData = workflow?.phases?.[phase.id];
          
          return (
            <div key={phase.id} className="relative">
              {/* Connector Line */}
              {index < phases.length - 1 && (
                <div className={`
                  absolute left-6 top-12 w-0.5 h-8 -mt-2
                  ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
              
              <div className={`
                flex items-start space-x-4 p-4 rounded-lg border-2 transition-all
                ${status === 'completed' ? 'border-green-200 bg-green-50' :
                  status === 'active' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'}
              `}>
                {/* Phase Icon */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full transition-colors
                  ${status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'active' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'}
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : status === 'active' ? (
                    <PlayCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                {/* Phase Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`
                        font-semibold text-lg
                        ${status === 'completed' ? 'text-green-900' :
                          status === 'active' ? 'text-blue-900' :
                          'text-gray-700'}
                      `}>
                        {phase.label}
                      </h4>
                      <p className={`
                        text-sm mt-1
                        ${status === 'completed' ? 'text-green-700' :
                          status === 'active' ? 'text-blue-700' :
                          'text-gray-600'}
                      `}>
                        {phase.description}
                      </p>
                      
                      {/* Phase Details */}
                      {phaseData?.dateCreation && (
                        <p className="text-xs text-gray-500 mt-2">
                          Créé le {new Date(phaseData.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    {status === 'active' && canAdvancePhase(phase.id) && (
                      <button
                        onClick={() => onAdvancePhase?.(phase.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Settings className="w-4 h-4" />
                        )}
                        <span>Configurer</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Status Details */}
                  {status === 'completed' && (
                    <div className="mt-3 p-3 bg-green-100 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Phase terminée</span>
                      </div>
                    </div>
                  )}
                  
                  {status === 'active' && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-800">
                        <PlayCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Phase en cours</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Actions */}
      {workflow?.nextActions && workflow.nextActions.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Prochaines actions :</h4>
          <ul className="list-disc list-inside space-y-1">
            {workflow.nextActions.map((action, index) => (
              <li key={index} className="text-sm text-yellow-800">{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatus;