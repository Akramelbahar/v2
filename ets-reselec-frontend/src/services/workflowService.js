// ets-reselec-frontend/src/services/workflowService.js
// Simplified workflow service that works with existing database schema

import api from './api';

export const workflowService = {
  // Get workflow status using existing intervention data
  getInterventionWorkflow: (id) => 
    api.get(`/workflow/intervention/${id}`),
  
  // Transition status using existing intervention endpoints
  transitionStatus: (id, status, reason = '') => 
    api.put(`/interventions/${id}/status`, { 
      statut: status, 
      reason 
    }),
  
  // Update diagnostic using existing diagnostic endpoint
  updateDiagnostic: (id, data) => 
    api.post(`/interventions/${id}/diagnostic`, data),
  
  // Update planning using existing planification endpoint  
  updatePlanification: (id, data) => 
    api.put(`/interventions/${id}/planification`, data),
  
  // Add quality control using existing endpoint
  addControleQualite: (id, data) => 
    api.post(`/interventions/${id}/controle-qualite`, data),
  
  // Get dashboard data from existing endpoints
  getDashboard: async (timeframe = '30') => {
    try {
      // Combine data from existing dashboard endpoints
      const [stats, interventions] = await Promise.all([
        api.get('/dashboard/stats', { params: { timeframe } }),
        api.get('/interventions', { params: { limit: 100 } })
      ]);
      
      // Process data to create workflow dashboard
      return {
        data: {
          data: processWorkflowDashboard(stats.data.data, interventions.data.data)
        }
      };
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error;
    }
  },
  
  // Client-side workflow validation and helpers
  canTransition: (currentStatus, targetStatus) => {
    const validTransitions = {
      'PLANIFIEE': ['EN_ATTENTE_PDR', 'ANNULEE'],
      'EN_ATTENTE_PDR': ['EN_COURS', 'ANNULEE'],
      'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC'],
      'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
      'TERMINEE': [],
      'ANNULEE': [],
      'ECHEC': ['EN_COURS']
    };
    
    return validTransitions[currentStatus]?.includes(targetStatus) || false;
  },
  
  // Derive workflow phase from intervention data
  getWorkflowPhase: (intervention) => {
    if (!intervention) return 'UNKNOWN';
    
    // Use existing data to determine phase
    if (!intervention.diagnostic) {
      return 'DIAGNOSTIC';
    }
    
    if (!intervention.planification || !intervention.planification.disponibilitePDR) {
      return 'PLANIFICATION';
    }
    
    if (intervention.statut === 'EN_COURS' || intervention.statut === 'EN_PAUSE') {
      return 'EXECUTION';
    }
    
    if (intervention.controleQualite && intervention.statut !== 'TERMINEE') {
      return 'CONTROLE_QUALITE';
    }
    
    if (intervention.statut === 'TERMINEE') {
      return 'COMPLETE';
    }
    
    return 'UNKNOWN';
  },
  
  // Calculate completion using existing data
  calculateCompletion: (intervention) => {
    if (!intervention) return 0;
    
    let percentage = 0;
    
    // Each phase contributes 25%
    if (intervention.diagnostic) percentage += 25;
    if (intervention.planification?.disponibilitePDR) percentage += 25;
    if (intervention.controleQualite) percentage += 25;
    if (intervention.statut === 'TERMINEE') percentage += 25;
    
    return percentage;
  },
  
  // Parse work items from description text
  parseWorkItems: (description) => {
    if (!description) return [];
    
    const workItems = [];
    const lines = description.split('\n');
    let inWorkSection = false;
    
    lines.forEach((line, index) => {
      if (line.includes('TRAVAUX REQUIS')) {
        inWorkSection = true;
        return;
      }
      
      if (line.includes('PIECES DE RECHANGE') || line.includes('OBSERVATIONS')) {
        inWorkSection = false;
        return;
      }
      
      if (inWorkSection && (line.trim().startsWith('- ') || line.trim().startsWith('• '))) {
        const text = line.trim().substring(2);
        const match = text.match(/^(.+?)\s*\((\w+),\s*(\d+)min\)$/);
        
        if (match) {
          workItems.push({
            id: index,
            description: match[1],
            priorite: match[2],
            duree_estimee: parseInt(match[3]),
            completed: false
          });
        } else {
          workItems.push({
            id: index,
            description: text,
            priorite: 'NORMALE',
            duree_estimee: 30,
            completed: false
          });
        }
      }
    });
    
    // Return default items if none found
    return workItems.length > 0 ? workItems : [
      {
        id: 1,
        description: 'Inspection visuelle générale',
        priorite: 'HAUTE',
        duree_estimee: 30,
        completed: false
      },
      {
        id: 2,
        description: 'Test de fonctionnement',
        priorite: 'NORMALE',
        duree_estimee: 45,
        completed: false
      }
    ];
  },
  
  // Parse spare parts from description
  parseSpareParts: (description) => {
    if (!description) return [];
    
    const spareParts = [];
    const lines = description.split('\n');
    let inPartsSection = false;
    
    lines.forEach((line, index) => {
      if (line.includes('PIECES DE RECHANGE')) {
        inPartsSection = true;
        return;
      }
      
      if (line.includes('OBSERVATIONS')) {
        inPartsSection = false;
        return;
      }
      
      if (inPartsSection && (line.trim().startsWith('• ') || line.trim().startsWith('- '))) {
        const text = line.trim().substring(2);
        const match = text.match(/^(.+?)\s*x(\d+)(?:\s*\((.+?)\))?$/);
        
        if (match) {
          spareParts.push({
            id: index,
            piece: match[1],
            quantite: parseInt(match[2]),
            fournisseur: match[3] || null,
            disponible: Math.random() > 0.3 // Random availability for demo
          });
        } else {
          spareParts.push({
            id: index,
            piece: text,
            quantite: 1,
            disponible: true
          });
        }
      }
    });
    
    return spareParts;
  },
  
  // Generate next actions based on current state
  getNextActions: (intervention) => {
    if (!intervention) return [];
    
    const actions = [];
    
    switch (intervention.statut) {
      case 'PLANIFIEE':
        if (!intervention.diagnostic) {
          actions.push({
            action: 'START_DIAGNOSTIC',
            label: 'Commencer le diagnostic',
            description: 'Analyser l\'équipement et identifier les travaux'
          });
        }
        break;
        
      case 'EN_ATTENTE_PDR':
        actions.push({
          action: 'UPDATE_PLANNING',
          label: 'Mettre à jour la planification',
          description: 'Vérifier les ressources et planifier les travaux'
        });
        if (intervention.planification?.disponibilitePDR) {
          actions.push({
            action: 'START_WORK',
            label: 'Commencer les travaux',
            description: 'Démarrer l\'intervention'
          });
        }
        break;
        
      case 'EN_COURS':
        actions.push({
          action: 'QUALITY_CONTROL',
          label: 'Contrôle qualité',
          description: 'Effectuer les vérifications et tests'
        });
        actions.push({
          action: 'PAUSE_WORK',
          label: 'Mettre en pause',
          description: 'Suspendre temporairement'
        });
        break;
        
      case 'EN_PAUSE':
        actions.push({
          action: 'RESUME_WORK',
          label: 'Reprendre',
          description: 'Continuer l\'intervention'
        });
        break;
    }
    
    return actions;
  },
  
  // Validate diagnostic data
  validateDiagnostic: (data) => {
    const errors = [];
    
    if (!data.travailRequis || data.travailRequis.length === 0) {
      errors.push('Au moins un travail requis doit être spécifié');
    }
    
    data.travailRequis?.forEach((travail, index) => {
      if (!travail.description || travail.description.trim().length < 5) {
        errors.push(`Description du travail ${index + 1} trop courte`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Create rich intervention data from existing data
  enrichInterventionData: (intervention) => {
    if (!intervention) return null;
    
    return {
      ...intervention,
      
      // Derive additional fields
      type_intervention: deriveInterventionType(intervention),
      priorite: intervention.urgence ? 'HAUTE' : 'NORMALE',
      
      // Add workflow-specific data
      workflow: {
        currentPhase: workflowService.getWorkflowPhase(intervention),
        completionPercentage: workflowService.calculateCompletion(intervention),
        nextActions: workflowService.getNextActions(intervention),
        canTransition: (status) => workflowService.canTransition(intervention.statut, status)
      },
      
      // Parse structured data from description
      parsedData: {
        workItems: workflowService.parseWorkItems(intervention.description),
        spareParts: workflowService.parseSpareParts(intervention.description)
      }
    };
  }
};

// Helper functions
const processWorkflowDashboard = (stats, interventions) => {
  const processed = {
    overview: stats.overview || {},
    statusDistribution: {},
    phaseDistribution: {
      diagnostic: 0,
      planification: 0,
      controleQualite: 0,
      completed: 0
    },
    metrics: {
      completionRate: 0,
      diagnosticCoverage: 0,
      planningCoverage: 0,
      qualityCoverage: 0
    }
  };
  
  if (interventions && interventions.length > 0) {
    // Process interventions to get workflow metrics
    const total = interventions.length;
    let diagnostic = 0, planning = 0, quality = 0, completed = 0;
    
    interventions.forEach(intervention => {
      // Count phases
      if (intervention.diagnostic) diagnostic++;
      if (intervention.planification) planning++;
      if (intervention.controleQualite) quality++;
      if (intervention.statut === 'TERMINEE') completed++;
      
      // Count by status
      processed.statusDistribution[intervention.statut] = 
        (processed.statusDistribution[intervention.statut] || 0) + 1;
    });
    
    processed.phaseDistribution = {
      diagnostic,
      planification: planning,
      controleQualite: quality,
      completed
    };
    
    processed.metrics = {
      completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
      diagnosticCoverage: total > 0 ? (diagnostic / total * 100).toFixed(1) : 0,
      planningCoverage: total > 0 ? (planning / total * 100).toFixed(1) : 0,
      qualityCoverage: total > 0 ? (quality / total * 100).toFixed(1) : 0
    };
  }
  
  return processed;
};

const deriveInterventionType = (intervention) => {
  const description = intervention.description?.toLowerCase() || '';
  
  if (description.includes('préventive') || description.includes('preventive')) {
    return 'MAINTENANCE_PREVENTIVE';
  } else if (description.includes('corrective')) {
    return 'MAINTENANCE_CORRECTIVE';
  } else if (description.includes('réparation')) {
    return 'REPARATION';
  } else if (description.includes('rénovation')) {
    return 'RENOVATION';
  } else if (description.includes('inspection')) {
    return 'INSPECTION';
  }
  
  return 'MAINTENANCE_CORRECTIVE';
};

export default workflowService;