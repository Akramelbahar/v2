const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Intervention, 
  Equipment, 
  Client, 
  User, 
  Role,
  Section,
  Diagnostic, 
  Planification, 
  ControleQualite,
  Rapport,
  sequelize 
} = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');


// Valid status transitions - Fixed logic
const VALID_STATUS_TRANSITIONS = {
  'PLANIFIEE': ['EN_ATTENTE_PDR', 'EN_COURS', 'ANNULEE'],
  'EN_ATTENTE_PDR': ['EN_COURS', 'PLANIFIEE', 'ANNULEE'],
  'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC', 'EN_ATTENTE_PDR'],
  'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
  'TERMINEE': [], // Final state - no transitions allowed
  'ANNULEE': ['PLANIFIEE'], // Allow reactivation
  'ECHEC': ['PLANIFIEE', 'EN_COURS'] // Allow restart
};

// GET /api/interventions
const getAllInterventions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      statut,
      urgence,
      dateFrom,
      dateTo,
      equipement_id,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};

    // Get current user with role
    const currentUser = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    const isAdmin = currentUser.role?.nom === 'Administrateur';

    // Build search conditions
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { '$equipement.nom$': { [Op.like]: `%${search}%` } },
        { '$equipement.proprietaire.nom_entreprise$': { [Op.like]: `%${search}%` } }
      ];
    }

    if (statut) whereClause.statut = statut;
    if (urgence !== undefined) whereClause.urgence = urgence === 'true';
    if (equipement_id) whereClause.equipement_id = equipement_id;
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    // Include configuration
    const includeConfig = [
      {
        model: Equipment,
        as: 'equipement',
        attributes: ['id', 'nom', 'marque', 'modele', 'type_equipement'],
        include: [{
          model: Client,
          as: 'proprietaire',
          attributes: ['id', 'nom_entreprise']
        }]
      },
      {
        model: User,
        as: 'creerPar',
        attributes: ['id', 'nom', 'username', 'section_id'],
        // Filter by section for non-admin users
        where: !isAdmin && currentUser.section_id ? 
          { section_id: currentUser.section_id } : 
          {}
      }
    ];

    const { count, rows } = await Intervention.findAndCountAll({
      where: whereClause,
      include: includeConfig,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get interventions error:', error);
    sendError(res, 'Failed to retrieve interventions', 500, error.message);
  }
};

// GET /api/interventions/:id
const getInterventionById = async (req, res) => {
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
            attributes: ['id', 'nom_entreprise', 'contact_principal', 'telephone_contact', 'email_contact']
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
          attributes: ['id', 'dateCreation', 'contenu', 'validation']
        }
      ]
    });

    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    // Convert to plain object
    const interventionData = intervention.toJSON();

    // If diagnostic exists, fetch the related data from junction tables
    if (interventionData.diagnostic) {
      try {
        const [travailRequis, besoinPDR, chargesRealisees] = await Promise.all([
          sequelize.query(
            'SELECT travail FROM Diagnostic_travailRequis WHERE diagnostic_id = ?',
            { 
              replacements: [interventionData.diagnostic.id],
              type: sequelize.QueryTypes.SELECT 
            }
          ),
          sequelize.query(
            'SELECT besoin FROM Diagnostic_besoinPDR WHERE diagnostic_id = ?',
            { 
              replacements: [interventionData.diagnostic.id],
              type: sequelize.QueryTypes.SELECT 
            }
          ),
          sequelize.query(
            'SELECT charge FROM Diagnostic_chargesRealisees WHERE diagnostic_id = ?',
            { 
              replacements: [interventionData.diagnostic.id],
              type: sequelize.QueryTypes.SELECT 
            }
          )
        ]);

        // Add the arrays to diagnostic data
        interventionData.diagnostic.travailRequis = travailRequis.map(t => t.travail);
        interventionData.diagnostic.besoinPDR = besoinPDR.map(b => b.besoin);
        interventionData.diagnostic.chargesRealisees = chargesRealisees.map(c => c.charge);
      } catch (diagError) {
        console.error('Error fetching diagnostic details:', diagError);
        // Set empty arrays as fallback
        interventionData.diagnostic.travailRequis = [];
        interventionData.diagnostic.besoinPDR = [];
        interventionData.diagnostic.chargesRealisees = [];
      }
    }

    sendSuccess(res, interventionData);

  } catch (error) {
    console.error('Get intervention by ID error:', error);
    sendError(res, 'Failed to retrieve intervention', 500, error.message);
  }
};
// POST /api/interventions
const createIntervention = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { equipement_id, date, description, urgence = false, statut = 'PLANIFIEE' } = req.body;

    // Get user with section
    const user = await User.findByPk(req.userId);
    
    // Verify equipment exists
    const equipment = await Equipment.findByPk(equipement_id);
    if (!equipment) {
      await transaction.rollback();
      return sendError(res, 'Equipment not found', 404);
    }

    // Create intervention
    const intervention = await Intervention.create({
      date,
      description,
      statut,
      urgence,
      creerPar_id: req.userId,
      equipement_id
    }, { transaction });

    // Assign intervention to user's section
    if (user.section_id) {
      await sequelize.query(
        'INSERT INTO Section_Intervention (section_id, intervention_id) VALUES (?, ?)',
        { 
          replacements: [user.section_id, intervention.id],
          transaction 
        }
      );
    }

    // Initialize workflow phases if needed
    if (statut === 'PLANIFIEE') {
      await Diagnostic.create({
        dateCreation: new Date(),
        intervention_id: intervention.id
      }, { transaction });
    }

    await transaction.commit();

    // Reload with associations
    const createdIntervention = await Intervention.findByPk(intervention.id, {
      include: [
        {
          model: Equipment,
          as: 'equipement',
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['id', 'nom_entreprise']
          }]
        },
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom']
        },
        {
          model: Diagnostic,
          as: 'diagnostic'
        }
      ]
    });

    sendSuccess(res, createdIntervention, 'Intervention created successfully', 201);

  } catch (error) {
    await transaction.rollback();
    console.error('Create intervention error:', error);
    sendError(res, 'Failed to create intervention', 500, error.message);
  }
};

// Helper function to get diagnostic with arrays
const getDiagnosticWithArrays = async (diagnosticId) => {
  try {
    const diagnostic = await Diagnostic.findByPk(diagnosticId);
    if (!diagnostic) return null;
    
    const [travailRequis, besoinPDR, chargesRealisees] = await Promise.all([
      sequelize.query(
        'SELECT travail FROM Diagnostic_travailRequis WHERE diagnostic_id = ? ORDER BY id',
        { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        'SELECT besoin FROM Diagnostic_besoinPDR WHERE diagnostic_id = ? ORDER BY id',
        { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        'SELECT charge FROM Diagnostic_chargesRealisees WHERE diagnostic_id = ? ORDER BY id',
        { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
      )
    ]);

    return {
      ...diagnostic.toJSON(),
      travailRequis: travailRequis.map(t => t.travail).filter(Boolean),
      besoinPDR: besoinPDR.map(b => b.besoin).filter(Boolean),
      chargesRealisees: chargesRealisees.map(c => c.charge).filter(Boolean)
    };
  } catch (error) {
    console.error('Error getting diagnostic with arrays:', error);
    return null;
  }
};

// POST /api/interventions/:id/diagnostic
const createOrUpdateDiagnostic = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { travailRequis = [], besoinPDR = [], chargesRealisees = [] } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      await transaction.rollback();
      return sendError(res, 'Intervention not found', 404);
    }

    // Find or create diagnostic
    let diagnostic = await Diagnostic.findOne({
      where: { intervention_id: id }
    });

    if (!diagnostic) {
      diagnostic = await Diagnostic.create({
        dateCreation: new Date(),
        intervention_id: id
      }, { transaction });
    }

    // Clear existing arrays
    await Promise.all([
      sequelize.query(
        'DELETE FROM Diagnostic_travailRequis WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id], transaction }
      ),
      sequelize.query(
        'DELETE FROM Diagnostic_besoinPDR WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id], transaction }
      ),
      sequelize.query(
        'DELETE FROM Diagnostic_chargesRealisees WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id], transaction }
      )
    ]);

    // Insert new data
    const insertPromises = [];

    // Insert travail requis
    travailRequis.forEach(travail => {
      if (travail && travail.trim()) {
        insertPromises.push(
          sequelize.query(
            'INSERT INTO Diagnostic_travailRequis (diagnostic_id, travail) VALUES (?, ?)',
            { replacements: [diagnostic.id, travail.trim()], transaction }
          )
        );
      }
    });

    // Insert besoin PDR
    besoinPDR.forEach(besoin => {
      if (besoin && besoin.trim()) {
        insertPromises.push(
          sequelize.query(
            'INSERT INTO Diagnostic_besoinPDR (diagnostic_id, besoin) VALUES (?, ?)',
            { replacements: [diagnostic.id, besoin.trim()], transaction }
          )
        );
      }
    });

    // Insert charges realisees
    chargesRealisees.forEach(charge => {
      if (charge && charge.trim()) {
        insertPromises.push(
          sequelize.query(
            'INSERT INTO Diagnostic_chargesRealisees (diagnostic_id, charge) VALUES (?, ?)',
            { replacements: [diagnostic.id, charge.trim()], transaction }
          )
        );
      }
    });

    await Promise.all(insertPromises);

    // Update intervention status based on diagnostic completion
    const hasContent = travailRequis.length > 0 || besoinPDR.length > 0 || chargesRealisees.length > 0;
    if (hasContent && intervention.statut === 'PLANIFIEE') {
      await intervention.update({ statut: 'EN_ATTENTE_PDR' }, { transaction });
    }

    await transaction.commit();

    // Get updated diagnostic with arrays
    const updatedDiagnostic = await getDiagnosticWithArrays(diagnostic.id);
    
    sendSuccess(res, updatedDiagnostic, 'Diagnostic updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Create/update diagnostic error:', error);
    sendError(res, 'Failed to update diagnostic', 500, error.message);
  }
};

// PUT /api/interventions/:id/planification
const updatePlanification = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { capaciteExecution, urgencePrise, disponibilitePDR } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      await transaction.rollback();
      return sendError(res, 'Intervention not found', 404);
    }

    // Find or create planification
    let planification = await Planification.findOne({
      where: { intervention_id: id }
    });

    if (!planification) {
      planification = await Planification.create({
        dateCreation: new Date(),
        intervention_id: id,
        capaciteExecution: capaciteExecution || null,
        urgencePrise: urgencePrise || false,
        disponibilitePDR: disponibilitePDR || false
      }, { transaction });
    } else {
      await planification.update({
        capaciteExecution: capaciteExecution || null,
        urgencePrise: urgencePrise || false,
        disponibilitePDR: disponibilitePDR || false
      }, { transaction });
    }

    // Update intervention status based on planification
    if (disponibilitePDR && intervention.statut === 'EN_ATTENTE_PDR') {
      await intervention.update({ statut: 'EN_COURS' }, { transaction });
    }

    await transaction.commit();

    sendSuccess(res, planification, 'Planification updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Update planification error:', error);
    sendError(res, 'Failed to update planification', 500, error.message);
  }
};

// POST /api/interventions/:id/controle-qualite
const addControleQualite = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { resultatsEssais, analyseVibratoire } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      await transaction.rollback();
      return sendError(res, 'Intervention not found', 404);
    }

    // Create or update quality control
    let controleQualite = await ControleQualite.findOne({
      where: { intervention_id: id }
    });

    if (!controleQualite) {
      controleQualite = await ControleQualite.create({
        dateControle: new Date(),
        resultatsEssais: resultatsEssais || '',
        analyseVibratoire: analyseVibratoire || '',
        intervention_id: id
      }, { transaction });
    } else {
      await controleQualite.update({
        resultatsEssais: resultatsEssais || '',
        analyseVibratoire: analyseVibratoire || ''
      }, { transaction });
    }

    await transaction.commit();

    sendSuccess(res, controleQualite, 'Quality control updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Add quality control error:', error);
    sendError(res, 'Failed to update quality control', 500, error.message);
  }
};

// PUT /api/interventions/:id/status
const updateInterventionStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { statut } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    const currentStatus = intervention.statut;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    // Check if the transition is valid
    if (!validTransitions.includes(statut)) {
      return sendError(res, 
        `Invalid status transition from ${currentStatus} to ${statut}. Valid transitions: ${validTransitions.join(', ')}`, 
        400
      );
    }

    await intervention.update({ statut });

    sendSuccess(res, intervention, 'Intervention status updated successfully');

  } catch (error) {
    console.error('Update intervention status error:', error);
    sendError(res, 'Failed to update intervention status', 500, error.message);
  }
};

// GET /api/interventions/:id/workflow
// GET /api/interventions/:id/workflow
const getWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findByPk(id, {
      include: [
        { 
          model: Diagnostic, 
          as: 'diagnostic',
          required: false // LEFT JOIN instead of INNER JOIN
        },
        { 
          model: Planification, 
          as: 'planification',
          required: false
        },
        { 
          model: ControleQualite, 
          as: 'controleQualite',
          required: false
        },
        {
          model: Equipment,
          as: 'equipement',
          attributes: ['id', 'nom', 'marque', 'modele'],
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['id', 'nom_entreprise']
          }]
        },
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom']
        }
      ]
    });

    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    // Dynamically determine phase completion based on actual data and business rules
    const diagnostic = intervention.diagnostic;
    const planification = intervention.planification;
    const controleQualite = intervention.controleQualite;

    // Enhanced workflow with real-time status determination
    const workflow = {
      intervention: {
        id: intervention.id,
        statut: intervention.statut,
        date: intervention.date,
        urgence: intervention.urgence,
        description: intervention.description,
        equipement: intervention.equipement,
        creerPar: intervention.creerPar
      },
      phases: {
        diagnostic: {
          completed: diagnostic ? isDiagnosticComplete(diagnostic) : false,
          dateCreation: diagnostic?.dateCreation,
          data: diagnostic ? {
            id: diagnostic.id,
            // Add any additional diagnostic fields you need
            travailRequis: await getDiagnosticTravailRequis(diagnostic.id),
            besoinPDR: await getDiagnosticBesoinPDR(diagnostic.id),
            chargesRealisees: await getDiagnosticChargesRealisees(diagnostic.id)
          } : null,
          canEdit: canEditPhase('diagnostic', intervention.statut),
          isRequired: true
        },
        planification: {
          completed: planification ? isPlanificationComplete(planification, intervention.statut) : false,
          dateCreation: planification?.dateCreation,
          data: planification ? {
            id: planification.id,
            capaciteExecution: planification.capaciteExecution,
            urgencePrise: planification.urgencePrise,
            disponibilitePDR: planification.disponibilitePDR
          } : null,
          canEdit: canEditPhase('planification', intervention.statut),
          isRequired: diagnostic?.completed || intervention.statut !== 'PLANIFIEE'
        },
        controleQualite: {
          completed: controleQualite ? isControleQualiteComplete(controleQualite) : false,
          dateControle: controleQualite?.dateControle,
          data: controleQualite ? {
            id: controleQualite.id,
            resultatsEssais: controleQualite.resultatsEssais,
            analyseVibratoire: controleQualite.analyseVibratoire
          } : null,
          canEdit: canEditPhase('controleQualite', intervention.statut),
          isRequired: intervention.statut === 'EN_COURS' || intervention.statut === 'TERMINEE'
        }
      },
      progress: calculateProgress(intervention, diagnostic, planification, controleQualite),
      nextActions: getNextActions(intervention, diagnostic, planification, controleQualite),
      timeline: await getWorkflowTimeline(id),
      canAdvance: canAdvanceWorkflow(intervention, diagnostic, planification, controleQualite)
    };

    sendSuccess(res, workflow);

  } catch (error) {
    console.error('Get workflow status error:', error);
    sendError(res, 'Failed to retrieve workflow status', 500, error.message);
  }
};

// Helper functions for dynamic workflow determination
const isDiagnosticComplete = (diagnostic) => {
  if (!diagnostic) return false;
  
  // Add your business logic here
  // For example, diagnostic is complete if it has required fields
  return diagnostic.dateCreation !== null;
};

const isPlanificationComplete = (planification, interventionStatus) => {
  if (!planification) return false;
  
  // Business logic: planification complete if resources are allocated
  return planification.disponibilitePDR === true && 
         planification.capaciteExecution !== null;
};

const isControleQualiteComplete = (controleQualite) => {
  if (!controleQualite) return false;
  
  // Business logic: quality control complete if both tests are done
  return controleQualite.resultatsEssais !== null || 
         controleQualite.analyseVibratoire !== null;
};

const canEditPhase = (phase, interventionStatus) => {
  // Define when each phase can be edited based on intervention status
  const editPermissions = {
    diagnostic: ['PLANIFIEE', 'EN_ATTENTE_PDR'],
    planification: ['EN_ATTENTE_PDR', 'EN_COURS'],
    controleQualite: ['EN_COURS', 'TERMINEE']
  };
  
  return editPermissions[phase]?.includes(interventionStatus) || false;
};

const calculateProgress = (intervention, diagnostic, planification, controleQualite) => {
  let completedPhases = 0;
  let totalPhases = 1; // Always at least intervention creation
  
  if (diagnostic) {
    totalPhases++;
    if (isDiagnosticComplete(diagnostic)) completedPhases++;
  }
  
  if (planification) {
    totalPhases++;
    if (isPlanificationComplete(planification, intervention.statut)) completedPhases++;
  }
  
  if (controleQualite) {
    totalPhases++;
    if (isControleQualiteComplete(controleQualite)) completedPhases++;
  }
  
  if (intervention.statut === 'TERMINEE') completedPhases = totalPhases;
  
  return {
    completed: completedPhases,
    total: totalPhases,
    percentage: Math.round((completedPhases / totalPhases) * 100)
  };
};

// Updated next actions function with more dynamic logic
const getNextActions = (intervention, diagnostic, planification, controleQualite) => {
  const actions = [];
  
  switch (intervention.statut) {
    case 'PLANIFIEE':
      if (!diagnostic) {
        actions.push('Créer le diagnostic initial');
      } else if (!isDiagnosticComplete(diagnostic)) {
        actions.push('Compléter le diagnostic');
      } else {
        actions.push('Passer en attente de pièces détachées');
      }
      break;
      
    case 'EN_ATTENTE_PDR':
      if (!planification) {
        actions.push('Planifier les ressources et la disponibilité');
      } else if (!isPlanificationComplete(planification, intervention.statut)) {
        actions.push('Finaliser la planification');
      } else {
        actions.push('Démarrer l\'intervention');
      }
      break;
      
    case 'EN_COURS':
      if (!controleQualite) {
        actions.push('Effectuer le contrôle qualité');
      } else if (!isControleQualiteComplete(controleQualite)) {
        actions.push('Compléter les tests de qualité');
      } else {
        actions.push('Finaliser l\'intervention');
      }
      break;
      
    case 'EN_PAUSE':
      actions.push('Reprendre l\'intervention');
      actions.push('Analyser la cause de la pause');
      break;
      
    case 'TERMINEE':
      actions.push('Générer le rapport final');
      actions.push('Archiver l\'intervention');
      break;
      
    case 'ECHEC':
      actions.push('Analyser les causes d\'échec');
      actions.push('Replanifier si nécessaire');
      break;
      
    case 'ANNULEE':
      actions.push('Documenter les raisons d\'annulation');
      break;
  }
  
  // Add common actions based on urgency
  if (intervention.urgence && intervention.statut !== 'TERMINEE') {
    actions.unshift('⚠️ Intervention urgente - Priorité élevée');
  }
  
  return actions;
};

const canAdvanceWorkflow = (intervention, diagnostic, planification, controleQualite) => {
  switch (intervention.statut) {
    case 'PLANIFIEE':
      return diagnostic && isDiagnosticComplete(diagnostic);
    case 'EN_ATTENTE_PDR':
      return planification && isPlanificationComplete(planification, intervention.statut);
    case 'EN_COURS':
      return controleQualite && isControleQualiteComplete(controleQualite);
    default:
      return false;
  }
};

const getWorkflowTimeline = async (interventionId) => {
  try {
    // Get all workflow-related activities for this intervention
    const timeline = [];
    
    const intervention = await Intervention.findByPk(interventionId);
    if (intervention) {
      timeline.push({
        phase: 'intervention',
        action: 'Intervention créée',
        date: intervention.createdAt || intervention.date,
        status: 'completed'
      });
    }
    
    const diagnostic = await Diagnostic.findOne({ where: { intervention_id: interventionId } });
    if (diagnostic) {
      timeline.push({
        phase: 'diagnostic',
        action: 'Diagnostic initié',
        date: diagnostic.dateCreation,
        status: isDiagnosticComplete(diagnostic) ? 'completed' : 'in_progress'
      });
    }
    
    const planification = await Planification.findOne({ where: { intervention_id: interventionId } });
    if (planification) {
      timeline.push({
        phase: 'planification',
        action: 'Planification créée',
        date: planification.dateCreation,
        status: isPlanificationComplete(planification, intervention.statut) ? 'completed' : 'in_progress'
      });
    }
    
    const controleQualite = await ControleQualite.findOne({ where: { intervention_id: interventionId } });
    if (controleQualite) {
      timeline.push({
        phase: 'controleQualite',
        action: 'Contrôle qualité effectué',
        date: controleQualite.dateControle,
        status: isControleQualiteComplete(controleQualite) ? 'completed' : 'in_progress'
      });
    }
    
    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error getting workflow timeline:', error);
    return [];
  }
};

// Helper functions to get diagnostic data (you may need to implement these based on your schema)
const getDiagnosticTravailRequis = async (diagnosticId) => {
  try {
    const results = await sequelize.query(
      'SELECT travail FROM Diagnostic_travailRequis WHERE diagnostic_id = ?',
      { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
    );
    return results.map(r => r.travail);
  } catch (error) {
    return [];
  }
};

const getDiagnosticBesoinPDR = async (diagnosticId) => {
  try {
    const results = await sequelize.query(
      'SELECT besoin FROM Diagnostic_besoinPDR WHERE diagnostic_id = ?',
      { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
    );
    return results.map(r => r.besoin);
  } catch (error) {
    return [];
  }
};

const getDiagnosticChargesRealisees = async (diagnosticId) => {
  try {
    const results = await sequelize.query(
      'SELECT charge FROM Diagnostic_chargesRealisees WHERE diagnostic_id = ?',
      { replacements: [diagnosticId], type: sequelize.QueryTypes.SELECT }
    );
    return results.map(r => r.charge);
  } catch (error) {
    return [];
  }
};
// Helper function to determine next actions


// GET /api/interventions/status-counts
const getStatusCounts = async (req, res) => {
  try {
    const counts = await Intervention.findAll({
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut'],
      raw: true
    });

    const statusCounts = counts.reduce((acc, item) => {
      acc[item.statut] = parseInt(item.count);
      return acc;
    }, {});

    // Ensure all possible statuses are included
    const allStatuses = ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'ECHEC'];
    allStatuses.forEach(status => {
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
    });

    sendSuccess(res, statusCounts);

  } catch (error) {
    console.error('Get status counts error:', error);
    sendError(res, 'Failed to retrieve status counts', 500, error.message);
  }
};

module.exports = {
  getAllInterventions,
  getInterventionById,
  createIntervention,
  createOrUpdateDiagnostic,
  updatePlanification,
  addControleQualite,
  updateInterventionStatus,
  getWorkflowStatus,
  getStatusCounts
};