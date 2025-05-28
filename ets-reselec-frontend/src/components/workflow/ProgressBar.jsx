// src/components/workflow/ProgressBar.jsx
import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const ProgressBar = ({ 
  workflow, 
  intervention,
  showLabels = true,
  showPercentage = true,
  size = 'default',
  className = ''
}) => {
  const phases = [
    { id: 'diagnostic', label: 'Diagnostic', shortLabel: 'Diag.' },
    { id: 'planification', label: 'Planification', shortLabel: 'Plan.' },
    { id: 'controleQualite', label: 'Contrôle Qualité', shortLabel: 'QC' }
  ];

  const sizeClasses = {
    small: 'h-2',
    default: 'h-3',
    large: 'h-4'
  };

  const getCompletedCount = () => {
    if (!workflow?.phases) return 0;
    return Object.values(workflow.phases).filter(phase => phase.completed).length;
  };

  const getProgressPercentage = () => {
    const completedCount = getCompletedCount();
    return Math.round((completedCount / phases.length) * 100);
  };

  const getCurrentPhase = () => {
    if (!workflow?.phases) return 0;
    return phases.findIndex(phase => !workflow.phases[phase.id]?.completed);
  };

  const getPhaseStatus = (phaseIndex) => {
    if (!workflow?.phases) return 'pending';
    
    const phase = phases[phaseIndex];
    if (workflow.phases[phase.id]?.completed) return 'completed';
    
    const currentPhaseIndex = getCurrentPhase();
    if (phaseIndex === currentPhaseIndex) return 'active';
    
    return 'pending';
  };

  const progressPercentage = getProgressPercentage();
  const currentPhaseIndex = getCurrentPhase();

  return (
    <div className={`w-full ${className}`}>
      {/* Main Progress Bar */}
      <div className="relative">
        <div className={`
          w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden
        `}>
          <div
            className={`
              h-full transition-all duration-500 ease-out
              ${intervention?.urgence ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}
              ${progressPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : ''}
            `}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Phase Markers */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-1">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const position = ((index + 1) / phases.length) * 100;
            
            return (
              <div
                key={phase.id}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className={`
                  w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center
                  ${status === 'completed' ? 'border-green-500 text-green-500' :
                    status === 'active' ? 'border-blue-500 text-blue-500' :
                    'border-gray-300 text-gray-400'}
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : status === 'active' ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels and Information */}
      {showLabels && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {phases.map((phase, index) => {
                const status = getPhaseStatus(index);
                
                return (
                  <div key={phase.id} className="flex items-center space-x-2">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${status === 'completed' ? 'bg-green-500' :
                        status === 'active' ? 'bg-blue-500' :
                        'bg-gray-300'}
                    `} />
                    <span className={`
                      text-sm font-medium
                      ${status === 'completed' ? 'text-green-700' :
                        status === 'active' ? 'text-blue-700' :
                        'text-gray-500'}
                    `}>
                      {size === 'small' ? phase.shortLabel : phase.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {showPercentage && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">
                  {progressPercentage}% terminé
                </span>
                {intervention?.urgence && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Current Phase Indicator */}
          {currentPhaseIndex < phases.length && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Phase actuelle: <span className="font-medium text-blue-600">
                  {phases[currentPhaseIndex]?.label}
                </span>
              </div>
              <div className="text-gray-500">
                {getCompletedCount()}/{phases.length} phases terminées
              </div>
            </div>
          )}
          
          {progressPercentage === 100 && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Workflow terminé avec succès</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for use in tables or cards
export const CompactProgressBar = ({ workflow, intervention, className = '' }) => {
  return (
    <ProgressBar
      workflow={workflow}
      intervention={intervention}
      showLabels={false}
      size="small"
      className={className}
    />
  );
};

// Mini version with just percentage
export const MiniProgressBar = ({ workflow, intervention, className = '' }) => {
  const phases = ['diagnostic', 'planification', 'controleQualite'];
  const completedCount = workflow?.phases ? 
    Object.values(workflow.phases).filter(phase => phase.completed).length : 0;
  const percentage = Math.round((completedCount / phases.length) * 100);
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            h-full transition-all duration-300
            ${intervention?.urgence ? 'bg-red-500' : 'bg-blue-500'}
            ${percentage === 100 ? 'bg-green-500' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[3rem]">
        {percentage}%
      </span>
    </div>
  );
};

export default ProgressBar;