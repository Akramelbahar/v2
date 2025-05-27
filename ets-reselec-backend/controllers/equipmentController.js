const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Equipment, Client, User, Intervention, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/equipment
const getAllEquipment = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type_equipement,
      proprietaire_id,
      status,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { marque: { [Op.like]: `%${search}%` } },
        { modele: { [Op.like]: `%${search}%` } }
      ];
    }

    // Type filter
    if (type_equipement) {
      whereClause.type_equipement = type_equipement;
    }

    // Owner filter
    if (proprietaire_id) {
      whereClause.proprietaire_id = proprietaire_id;
    }

    // Status filter (based on latest intervention status)
    let having = '';
    if (status) {
      having = sequelize.literal(`latestInterventionStatus = '${status}'`);
    }

    const { count, rows } = await Equipment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'proprietaire',
          attributes: ['id', 'nom_entreprise']
        },
        {
          model: User,
          as: 'ajouterPar',
          attributes: ['id', 'nom']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT statut
              FROM Intervention
              WHERE Intervention.equipement_id = Equipment.id
              ORDER BY Intervention.date DESC
              LIMIT 1
            )`),
            'latestInterventionStatus'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Intervention
              WHERE Intervention.equipement_id = Equipment.id
            )`),
            'interventionCount'
          ]
        ]
      },
      having,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get equipment error:', error);
    sendError(res, 'Failed to retrieve equipment', 500, error.message);
  }
};

// GET /api/equipment/:id
const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'proprietaire',
          attributes: ['id', 'nom_entreprise', 'contact_principal', 'telephone_contact', 'email_contact']
        },
        {
          model: User,
          as: 'ajouterPar',
          attributes: ['id', 'nom', 'username']
        },
        {
          model: Intervention,
          as: 'interventions',
          attributes: ['id', 'date', 'description', 'statut', 'urgence'],
          include: [{
            model: User,
            as: 'creerPar',
            attributes: ['nom']
          }],
          order: [['date', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!equipment) {
      return sendError(res, 'Equipment not found', 404);
    }

    // Get maintenance history statistics
    const stats = await Intervention.findAll({
      where: { equipement_id: id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalInterventions'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN statut = "TERMINEE" THEN 1 ELSE 0 END')), 'completedInterventions'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN urgence = true THEN 1 ELSE 0 END')), 'urgentInterventions']
      ],
      raw: true
    });

    const equipmentData = {
      ...equipment.toJSON(),
      maintenanceStats: stats[0] || { totalInterventions: 0, completedInterventions: 0, urgentInterventions: 0 }
    };

    sendSuccess(res, equipmentData);

  } catch (error) {
    console.error('Get equipment by ID error:', error);
    sendError(res, 'Failed to retrieve equipment', 500, error.message);
  }
};

// POST /api/equipment
const createEquipment = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    // Verify client exists
    const client = await Client.findByPk(req.body.proprietaire_id);
    if (!client) {
      return sendError(res, 'Client not found', 404);
    }

    const equipmentData = {
      ...req.body,
      ajouterPar_id: req.userId
    };

    const equipment = await Equipment.create(equipmentData);
    
    // Reload with associations
    const createdEquipment = await Equipment.findByPk(equipment.id, {
      include: [
        {
          model: Client,
          as: 'proprietaire',
          attributes: ['id', 'nom_entreprise']
        },
        {
          model: User,
          as: 'ajouterPar',
          attributes: ['id', 'nom']
        }
      ]
    });

    sendSuccess(res, createdEquipment, 'Equipment created successfully', 201);

  } catch (error) {
    console.error('Create equipment error:', error);
    sendError(res, 'Failed to create equipment', 500, error.message);
  }
};

// PUT /api/equipment/:id
const updateEquipment = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return sendError(res, 'Equipment not found', 404);
    }

    // If changing owner, verify new client exists
    if (req.body.proprietaire_id && req.body.proprietaire_id !== equipment.proprietaire_id) {
      const client = await Client.findByPk(req.body.proprietaire_id);
      if (!client) {
        return sendError(res, 'New client not found', 404);
      }
    }

    // Update equipment
    await equipment.update(req.body);

    // Reload with associations
    const updatedEquipment = await Equipment.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'proprietaire',
          attributes: ['id', 'nom_entreprise']
        },
        {
          model: User,
          as: 'ajouterPar',
          attributes: ['id', 'nom']
        }
      ]
    });

    sendSuccess(res, updatedEquipment, 'Equipment updated successfully');

  } catch (error) {
    console.error('Update equipment error:', error);
    sendError(res, 'Failed to update equipment', 500, error.message);
  }
};

// DELETE /api/equipment/:id
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return sendError(res, 'Equipment not found', 404);
    }

    // Check for active interventions
    const activeInterventionCount = await Intervention.count({
      where: { 
        equipement_id: id,
        statut: { 
          [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE'] 
        }
      }
    });

    if (activeInterventionCount > 0) {
      return sendError(res, 
        `Cannot delete equipment. ${activeInterventionCount} active intervention(s) are associated with this equipment.`, 
        400
      );
    }

    await equipment.destroy();

    sendSuccess(res, null, 'Equipment deleted successfully');

  } catch (error) {
    console.error('Delete equipment error:', error);
    sendError(res, 'Failed to delete equipment', 500, error.message);
  }
};

// GET /api/equipment/types
const getEquipmentTypes = async (req, res) => {
  try {
    const types = await sequelize.query(
      'SELECT value FROM TypeEquipement_enum ORDER BY value',
      { type: sequelize.QueryTypes.SELECT }
    );

    sendSuccess(res, types.map(t => t.value));

  } catch (error) {
    console.error('Get equipment types error:', error);
    sendError(res, 'Failed to retrieve equipment types', 500, error.message);
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentTypes
};