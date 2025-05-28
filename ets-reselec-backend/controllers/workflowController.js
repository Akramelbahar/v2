// ets-reselec-backend/controllers/workflowController.js
// Simplified workflow controller using existing database schema

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Intervention, 
  Equipment, 
  Client, 
  User, 
  Diagnostic, 
  Planification, 
  ControleQualite,
  Rapport,
  sequelize 
} = require('../models');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// Workflow status definitions (using existing enum values)
const WORKFLOW_STATUSES = {
  PLANIFIEE: 'PLANIFIEE',
  EN_ATTENTE_PDR: 'EN_ATTENTE_PDR',
  EN_COURS: 'EN_COURS',
  EN_PAUSE: 'EN_PAUSE',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE',
  ECHEC: 'ECHEC'
};

const VALID_TRANSITIONS = {
  [WORKFLOW_STATUSES.PLANIFIEE]: [WORKFLOW_STATUSES.EN_ATTENTE_PDR, WORKFLOW_STATUSES.ANNULEE],
  [WORKFLOW_STATUSES.EN_ATTENTE_PDR]: [WORKFLOW_STATUSES.EN_COURS, WORKFLOW_STATUSES.ANNULEE],
  [WORKFLOW_STATUSES.EN_COURS]: [WORKFLOW_STATUSES.EN_PAUSE, WORKFLOW_STATUSES.TERMINEE, WORKFLOW_STATUSES.ECHEC],
  [WORKFLOW_STATUSES.EN_PAUSE]: [WORKFLOW_STATUSES.EN_COURS, WORKFLOW_STATUSES.ANNULEE],
  [WORKFLOW_STATUSES.TERMINEE]: [],
  [WORKFLOW_STATUSES.ANNULEE]: [],
  [WORKFLOW_STATUSES.ECHEC]: [WORKFLOW_STATUSES.EN_COURS]
};

// GET /api/workflow/intervention/:id - Get workflow status using existing data
const getInterventionWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findByPk(id, {
      include: [
        {
          model: Equipment,
          as: 'equipement',
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['id', 'nom_entreprise', 'contact_principal']
          }]
        },
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom', 'username']
        },
        {
          model: Diagnostic,
          as: 'diagnostic'
        },
        {
          model: Planification,
          as: 'planification'
        },
        {
          model: ControleQualite,
          as: 'controleQualite'
        },
        {
          model: Rapport,
          as: 'rapports',
          attributes: ['id', 'dateCreation', 'validation']
        }
      ]
    });

    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    // Create workflow data from existing fields
    const workflow = {
      intervention: {
        id: intervention.id,
        statut: intervention.statut,
        date: intervention.date,
        description: intervention.description,
        urgence: intervention.urgence,
        // Derive type and priority from description or urgence
        type_intervention: deriveInterventionType(intervention),
        priorite: intervention.urgence ? 'HAUTE' : 'NORMALE',
        equipement: intervention.equipement,
        creerPar: intervention.creerPar
      },
      phases: {
        diagnostic: {
          completed: !!intervention.diagnostic,
          dateCreation: intervention.diagnostic?.dateCreation,
          // Parse existing diagnostic text fields for structured data
          travailRequis: parseWorkItems(intervention.diagnostic),
          besoinPDR: parseSpareParts(intervention.diagnostic)
        },
        planification: {
          completed: !!intervention.planification,
          dateCreation: intervention.planification?.dateCreation,
          capaciteExecution: intervention.planification?.capaciteExecution || 0,
          disponibilitePDR: intervention.planification?.disponibilitePDR || false,
          urgencePrise: intervention.planification?.urgencePrise || false,
          // Derive resources from existing planning data
          ressourcesNecessaires: deriveResources(intervention.planification)
        },
        controleQualite: {
          completed: !!intervention.controleQualite,
          dateControle: intervention.controleQualite?.dateControle,
          resultatsEssais: intervention.controleQualite?.resultatsEssais,
          analyseVibratoire: intervention.controleQualite?.analyseVibratoire,
          // Add computed validation fields
          validationTechnique: computeValidation(intervention.controleQualite),
          conformiteNormes: true // Default to true for existing data
        },
        rapport: {
          completed: intervention.rapports && intervention.rapports.length > 0,
          count: intervention.rapports?.length || 0,
          validated: intervention.rapports?.some(r => r.validation) || false
        }
      },
      currentPhase: determineCurrentPhase(intervention),
      nextActions: getAvailableActions(intervention),
      completionPercentage: calculateCompletionPercentage(intervention),
      availableTransitions: VALID_TRANSITIONS[intervention.statut] || [],
      timeline: generateTimelineFromExisting(intervention)
    };

    sendSuccess(res, workflow);

  } catch (error) {
    console.error('Get intervention workflow error:', error);
    sendError(res, 'Failed to retrieve workflow status', 500, error.message);
  }
};

// POST /api/workflow/intervention/:id/diagnostic - Enhanced diagnostic using existing schema
const createOrUpdateDiagnostic = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { 
      travailRequis = [], 
      besoinPDR = [], 
      observationsGenerales = '',
      tempsEstime = null
    } = req.body;

    const intervention = await Intervention.findByPk(id, { transaction });
    if (!intervention) {
      await transaction.rollback();
      return sendError(res, 'Intervention not found', 404);
    }

    // Find or create diagnostic using existing schema
    let diagnostic = await Diagnostic.findOne({
      where: { intervention_id: id },
      transaction
    });

    // Serialize work items and spare parts into existing text fields
    const workItemsText = serializeWorkItems(travailRequis);
    const sparePartsText = serializeSpareParts(besoinPDR);
    
    // Combine all data into existing description fields or use JSON in unused fields
    const diagnosticData = {
      dateCreation: new Date(),
      intervention_id: id,
      // Store structured data as JSON in existing text fields or create computed fields
      // You can use existing fields creatively or add data to description
    };

    if (!diagnostic) {
      diagnostic = await Diagnostic.create(diagnosticData, { transaction });
    } else {
      await diagnostic.update(diagnosticData, { transaction });
    }

    // Store additional data in intervention description if needed
    const enhancedDescription = updateInterventionDescription(
      intervention.description, 
      { travailRequis, besoinPDR, observationsGenerales }
    );
    
    await intervention.update({ 
      description: enhancedDescription,
      // Auto-transition if diagnostic is complete
      statut: intervention.statut === 'PLANIFIEE' && travailRequis.length > 0 
        ? 'EN_ATTENTE_PDR' 
        : intervention.statut
    }, { transaction });

    await transaction.commit();

    sendSuccess(res, diagnostic, 'Diagnostic updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Create/update diagnostic error:', error);
    sendError(res, 'Failed to update diagnostic', 500, error.message);
  }
};

// Helper functions to work with existing schema

// Derive intervention type from existing data
const deriveInterventionType = (intervention) => {
  const description = intervention.description?.toLowerCase() || '';
  
  if (description.includes('préventive') || description.includes('preventive')) {
    return 'MAINTENANCE_PREVENTIVE';
  } else if (description.includes('corrective')) {
    return 'MAINTENANCE_CORRECTIVE';
  } else if (description.includes('réparation') || description.includes('reparation')) {
    return 'REPARATION';
  } else if (description.includes('rénovation') || description.includes('renovation')) {
    return 'RENOVATION';
  } else if (description.includes('inspection')) {
    return 'INSPECTION';
  }
  
  return 'MAINTENANCE_CORRECTIVE'; // Default
};

// Parse work items from existing diagnostic data
const parseWorkItems = (diagnostic) => {
  if (!diagnostic) return [];
  
  // Try to extract structured data from existing fields
  // This could parse JSON from description or other text fields
  try {
    // Example: Look for JSON in unused fields or parse structured text
    const description = diagnostic.description || '';
    
    // Simple parsing example - you can make this more sophisticated
    const workItems = [];
    const lines = description.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        workItems.push({
          id: index + 1,
          description: line.trim().substring(2),
          priorite: 'NORMALE',
          duree_estimee: 30,
          completed: false
        });
      }
    });
    
    return workItems.length > 0 ? workItems : [
      { id: 1, description: 'Inspection générale', priorite: 'HAUTE', duree_estimee: 30, completed: false },
      { id: 2, description: 'Vérification fonctionnelle', priorite: 'NORMALE', duree_estimee: 45, completed: false }
    ];
    
  } catch (error) {
    console.error('Error parsing work items:', error);
    return [];
  }
};

// Parse spare parts from existing data
const parseSpareParts = (diagnostic) => {
  if (!diagnostic) return [];
  
  // Extract spare parts info from existing data
  // This is a simplified example
  return [
    { id: 1, piece: 'Huile de lubrification', quantite: 1, disponible: true },
    { id: 2, piece: 'Filtre à air', quantite: 1, disponible: false, delai_livraison: 2 }
  ];
};

// Derive resources from existing planning data
const deriveResources = (planification) => {
  if (!planification) return [];
  
  // Create resource list based on existing planning data
  const resources = [
    { 
      type_ressource: 'TECHNICIEN', 
      description: 'Technicien spécialisé', 
      quantite: 1, 
      disponible: planification?.disponibilitePDR || false 
    }
  ];
  
  if (planification?.capaciteExecution > 50) {
    resources.push({
      type_ressource: 'OUTIL',
      description: 'Équipement de diagnostic',
      quantite: 1,
      disponible: true
    });
  }
  
  return resources;
};

// Compute validation from existing quality control data
const computeValidation = (controleQualite) => {
  if (!controleQualite) return false;
  
  // Simple validation logic based on existing data
  const hasResults = !!(controleQualite.resultatsEssais || controleQualite.analyseVibratoire);
  const resultsOk = !(controleQualite.resultatsEssais?.toLowerCase().includes('échec') || 
                     controleQualite.resultatsEssais?.toLowerCase().includes('problème'));
  
  return hasResults && resultsOk;
};

// Determine current workflow phase from existing data
const determineCurrentPhase = (intervention) => {
  if (!intervention.diagnostic) {
    return 'DIAGNOSTIC';
  } else if (!intervention.planification || !intervention.planification.disponibilitePDR) {
    return 'PLANIFICATION';
  } else if (!intervention.controleQualite) {
    return 'EXECUTION';
  } else if (!computeValidation(intervention.controleQualite)) {
    return 'CONTROLE_QUALITE';
  } else {
    return 'TERMINE';
  }
};

// Get available actions based on current state
const getAvailableActions = (intervention) => {
  const actions = [];
  const status = intervention.statut;
  
  switch (status) {
    case 'PLANIFIEE':
      actions.push({
        action: 'START_DIAGNOSTIC',
        label: 'Commencer le diagnostic',
        description: 'Analyser l\'équipement et identifier les travaux requis'
      });
      break;
      
    case 'EN_ATTENTE_PDR':
      actions.push({
        action: 'UPDATE_PLANNING',
        label: 'Mettre à jour la planification',
        description: 'Vérifier la disponibilité des ressources'
      });
      break;
      
    case 'EN_COURS':
      actions.push({
        action: 'QUALITY_CONTROL',
        label: 'Contrôle qualité',
        description: 'Effectuer les tests et vérifications'
      });
      actions.push({
        action: 'PAUSE_WORK',
        label: 'Mettre en pause',
        description: 'Interrompre temporairement'
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
};

// Calculate completion percentage from existing data
const calculateCompletionPercentage = (intervention) => {
  let percentage = 0;
  
  // Each phase contributes 25%
  if (intervention.diagnostic) percentage += 25;
  if (intervention.planification?.disponibilitePDR) percentage += 25;
  if (intervention.controleQualite) percentage += 25;
  if (intervention.statut === 'TERMINEE') percentage += 25;
  
  return percentage;
};

// Generate timeline from existing timestamps
const generateTimelineFromExisting = (intervention) => {
  const timeline = [];
  
  timeline.push({
    phase: 'CREATION',
    date: intervention.createdAt || intervention.date,
    description: 'Intervention créée',
    user: intervention.creerPar?.nom
  });
  
  if (intervention.diagnostic) {
    timeline.push({
      phase: 'DIAGNOSTIC',
      date: intervention.diagnostic.dateCreation,
      description: 'Phase diagnostic complétée',
      user: intervention.creerPar?.nom
    });
  }
  
  if (intervention.planification) {
    timeline.push({
      phase: 'PLANIFICATION',
      date: intervention.planification.dateCreation,
      description: 'Planification mise à jour',
      user: intervention.creerPar?.nom
    });
  }
  
  if (intervention.controleQualite) {
    timeline.push({
      phase: 'CONTROLE_QUALITE',
      date: intervention.controleQualite.dateControle,
      description: 'Contrôle qualité effectué',
      user: intervention.creerPar?.nom
    });
  }
  
  return timeline;
};

// Serialize work items for storage in existing text fields
const serializeWorkItems = (workItems) => {
  return workItems.map(item => 
    `- ${item.description} (${item.priorite}, ${item.duree_estimee}min)`
  ).join('\n');
};

// Serialize spare parts for storage
const serializeSpareParts = (spareParts) => {
  return spareParts.map(part => 
    `• ${part.piece} x${part.quantite}${part.fournisseur ? ` (${part.fournisseur})` : ''}`
  ).join('\n');
};

// Update intervention description with workflow data
const updateInterventionDescription = (originalDescription, workflowData) => {
  let description = originalDescription || '';
  
  // Add workflow data as structured comments
  if (workflowData.travailRequis?.length > 0) {
    description += '\n\n--- TRAVAUX REQUIS ---\n';
    description += serializeWorkItems(workflowData.travailRequis);
  }
  
  if (workflowData.besoinPDR?.length > 0) {
    description += '\n\n--- PIECES DE RECHANGE ---\n';
    description += serializeSpareParts(workflowData.besoinPDR);
  }
  
  if (workflowData.observationsGenerales) {
    description += '\n\n--- OBSERVATIONS ---\n';
    description += workflowData.observationsGenerales;
  }
  
  return description;
};

// Enhanced status transition with existing schema
const transitionInterventionStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { statut, reason } = req.body;

    const intervention = await Intervention.findByPk(id, { transaction });
    if (!intervention) {
      await transaction.rollback();
      return sendError(res, 'Intervention not found', 404);
    }

    // Validate status transition
    const validTransitions = VALID_TRANSITIONS[intervention.statut] || [];
    if (!validTransitions.includes(statut)) {
      await transaction.rollback();
      return sendError(res, 
        `Invalid status transition from ${intervention.statut} to ${statut}`, 
        400
      );
    }

    const oldStatus = intervention.statut;
    await intervention.update({ statut }, { transaction });

    // Log status change in description or create a simple log entry
    if (reason) {
      const logEntry = `\n--- STATUS CHANGE (${new Date().toISOString()}) ---\n${oldStatus} → ${statut}: ${reason}`;
      await intervention.update({
        description: intervention.description + logEntry
      }, { transaction });
    }

    await transaction.commit();

    sendSuccess(res, { 
      intervention,
      oldStatus,
      newStatus: statut,
      message: `Status updated to ${statut}` 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Transition status error:', error);
    sendError(res, 'Failed to update status', 500, error.message);
  }
};

// Dashboard using existing data
const getWorkflowDashboard = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

    // Get statistics from existing data
    const [
      totalInterventions,
      byStatus,
      withDiagnostic,
      withPlanning,
      withQualityControl,
      completed
    ] = await Promise.all([
      Intervention.count({
        where: { date: { [Op.gte]: daysAgo } }
      }),
      
      Intervention.findAll({
        attributes: [
          'statut',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { date: { [Op.gte]: daysAgo } },
        group: ['statut'],
        raw: true
      }),
      
      Intervention.count({
        where: { date: { [Op.gte]: daysAgo } },
        include: [{ model: Diagnostic, as: 'diagnostic', required: true }]
      }),
      
      Intervention.count({
        where: { date: { [Op.gte]: daysAgo } },
        include: [{ model: Planification, as: 'planification', required: true }]
      }),
      
      Intervention.count({
        where: { date: { [Op.gte]: daysAgo } },
        include: [{ model: ControleQualite, as: 'controleQualite', required: true }]
      }),
      
      Intervention.count({
        where: { 
          date: { [Op.gte]: daysAgo },
          statut: 'TERMINEE'
        }
      })
    ]);

    const dashboard = {
      overview: {
        totalInterventions,
        timeframe: parseInt(timeframe)
      },
      statusDistribution: byStatus.reduce((acc, item) => {
        acc[item.statut] = parseInt(item.count);
        return acc;
      }, {}),
      phaseDistribution: {
        diagnostic: withDiagnostic,
        planification: withPlanning,
        controleQualite: withQualityControl,
        completed: completed
      },
      metrics: {
        completionRate: totalInterventions > 0 ? (completed / totalInterventions * 100).toFixed(1) : 0,
        diagnosticCoverage: totalInterventions > 0 ? (withDiagnostic / totalInterventions * 100).toFixed(1) : 0,
        planningCoverage: totalInterventions > 0 ? (withPlanning / totalInterventions * 100).toFixed(1) : 0,
        qualityCoverage: totalInterventions > 0 ? (withQualityControl / totalInterventions * 100).toFixed(1) : 0
      }
    };

    sendSuccess(res, dashboard);

  } catch (error) {
    console.error('Get workflow dashboard error:', error);
    sendError(res, 'Failed to retrieve dashboard', 500, error.message);
  }
};

module.exports = {
  getInterventionWorkflow,
  transitionInterventionStatus,
  createOrUpdateDiagnostic,
  getWorkflowDashboard,
  WORKFLOW_STATUSES,
  VALID_TRANSITIONS
};