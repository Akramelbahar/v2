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
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

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
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { '$equipement.nom$': { [Op.like]: `%${search}%` } },
        { '$equipement.proprietaire.nom_entreprise$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (statut) {
      whereClause.statut = statut;
    }

    // Urgency filter
    if (urgence !== undefined) {
      whereClause.urgence = urgence === 'true';
    }

    // Equipment filter
    if (equipement_id) {
      whereClause.equipement_id = equipement_id;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    const { count, rows } = await Intervention.findAndCountAll({
      where: whereClause,
      include: [
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
          attributes: ['id', 'nom', 'username']
        }
      ],
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

    sendSuccess(res, intervention);

  } catch (error) {
    console.error('Get intervention by ID error:', error);
    sendError(res, 'Failed to retrieve intervention', 500, error.message);
  }
};

// POST /api/interventions
const createIntervention = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { equipement_id, date, description, urgence = false, statut = 'PLANIFIEE' } = req.body;

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

// POST /api/interventions/:id/diagnostic
const createOrUpdateDiagnostic = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { travailRequis = [], besoinPDR = [], chargesRealisees = [] } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
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
      });
    }

    // Update diagnostic arrays (using raw SQL for simplicity)
    if (travailRequis.length > 0) {
      await sequelize.query(
        'DELETE FROM Diagnostic_travailRequis WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id] }
      );
      
      for (const travail of travailRequis) {
        await sequelize.query(
          'INSERT INTO Diagnostic_travailRequis (diagnostic_id, travail) VALUES (?, ?)',
          { replacements: [diagnostic.id, travail] }
        );
      }
    }

    if (besoinPDR.length > 0) {
      await sequelize.query(
        'DELETE FROM Diagnostic_besoinPDR WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id] }
      );
      
      for (const besoin of besoinPDR) {
        await sequelize.query(
          'INSERT INTO Diagnostic_besoinPDR (diagnostic_id, besoin) VALUES (?, ?)',
          { replacements: [diagnostic.id, besoin] }
        );
      }
    }

    if (chargesRealisees.length > 0) {
      await sequelize.query(
        'DELETE FROM Diagnostic_chargesRealisees WHERE diagnostic_id = ?',
        { replacements: [diagnostic.id] }
      );
      
      for (const charge of chargesRealisees) {
        await sequelize.query(
          'INSERT INTO Diagnostic_chargesRealisees (diagnostic_id, charge) VALUES (?, ?)',
          { replacements: [diagnostic.id, charge] }
        );
      }
    }

    // Update intervention status
    if (intervention.statut === 'PLANIFIEE') {
      await intervention.update({ statut: 'EN_ATTENTE_PDR' });
    }

    sendSuccess(res, diagnostic, 'Diagnostic updated successfully');

  } catch (error) {
    console.error('Create/update diagnostic error:', error);
    sendError(res, 'Failed to update diagnostic', 500, error.message);
  }
};

// PUT /api/interventions/:id/planification
const updatePlanification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { capaciteExecution, urgencePrise, disponibilitePDR } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
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
        capaciteExecution,
        urgencePrise,
        disponibilitePDR
      });
    } else {
      await planification.update({
        capaciteExecution,
        urgencePrise,
        disponibilitePDR
      });
    }

    // Update intervention status
    if (intervention.statut === 'EN_ATTENTE_PDR' && disponibilitePDR) {
      await intervention.update({ statut: 'EN_COURS' });
    }

    sendSuccess(res, planification, 'Planification updated successfully');

  } catch (error) {
    console.error('Update planification error:', error);
    sendError(res, 'Failed to update planification', 500, error.message);
  }
};

// POST /api/interventions/:id/controle-qualite
const addControleQualite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { resultatsEssais, analyseVibratoire } = req.body;

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    // Create or update quality control
    let controleQualite = await ControleQualite.findOne({
      where: { intervention_id: id }
    });

    if (!controleQualite) {
      controleQualite = await ControleQualite.create({
        dateControle: new Date(),
        resultatsEssais,
        analyseVibratoire,
        intervention_id: id
      });
    } else {
      await controleQualite.update({
        resultatsEssais,
        analyseVibratoire
      });
    }

    sendSuccess(res, controleQualite, 'Quality control added successfully', 201);

  } catch (error) {
    console.error('Add quality control error:', error);
    sendError(res, 'Failed to add quality control', 500, error.message);
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

    // Validate status transition
    const validTransitions = {
      'PLANIFIEE': ['EN_ATTENTE_PDR', 'ANNULEE'],
      'EN_ATTENTE_PDR': ['EN_COURS', 'ANNULEE'],
      'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC'],
      'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
      'TERMINEE': [],
      'ANNULEE': [],
      'ECHEC': ['EN_COURS']
    };

    if (!validTransitions[intervention.statut].includes(statut)) {
      return sendError(res, 
        `Invalid status transition from ${intervention.statut} to ${statut}`, 
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
const getWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const intervention = await Intervention.findByPk(id, {
      include: [
        { model: Diagnostic, as: 'diagnostic' },
        { model: Planification, as: 'planification' },
        { model: ControleQualite, as: 'controleQualite' }
      ]
    });

    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    const workflow = {
      intervention: {
        id: intervention.id,
        statut: intervention.statut,
        date: intervention.date,
        urgence: intervention.urgence
      },
      phases: {
        diagnostic: {
          completed: !!intervention.diagnostic,
          dateCreation: intervention.diagnostic?.dateCreation
        },
        planification: {
          completed: !!intervention.planification,
          dateCreation: intervention.planification?.dateCreation,
          disponibilitePDR: intervention.planification?.disponibilitePDR
        },
        controleQualite: {
          completed: !!intervention.controleQualite,
          dateControle: intervention.controleQualite?.dateControle
        }
      },
      nextActions: getNextActions(intervention)
    };

    sendSuccess(res, workflow);

  } catch (error) {
    console.error('Get workflow status error:', error);
    sendError(res, 'Failed to retrieve workflow status', 500, error.message);
  }
};

// Helper function to determine next actions
const getNextActions = (intervention) => {
  const actions = [];
  
  switch (intervention.statut) {
    case 'PLANIFIEE':
      actions.push('Complete diagnostic phase');
      break;
    case 'EN_ATTENTE_PDR':
      actions.push('Update planning and resource availability');
      break;
    case 'EN_COURS':
      actions.push('Perform maintenance work', 'Add quality control results');
      break;
    case 'TERMINEE':
      actions.push('Generate final report');
      break;
  }
  
  return actions;
};

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