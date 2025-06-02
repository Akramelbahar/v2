// ets-reselec-backend/controllers/sectionController.js
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Section, 
  User, 
  Intervention, 
  Equipment, 
  Client,
  sequelize 
} = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/sections
const getAllSections = async (req, res) => {
  try {
    const sections = await Section.findAll({
      include: [
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'username']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Utilisateur
              WHERE Utilisateur.section_id = Section.id
            )`),
            'userCount'
          ]
        ]
      },
      order: [['nom', 'ASC']]
    });

    sendSuccess(res, sections);

  } catch (error) {
    console.error('Get sections error:', error);
    sendError(res, 'Failed to retrieve sections', 500, error.message);
  }
};

// GET /api/sections/:id
const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findByPk(id, {
      include: [
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'username']
        },
        {
          model: User,
          as: 'utilisateurs',
          attributes: ['id', 'nom', 'username'],
          include: [{
            model: Role,
            as: 'role',
            attributes: ['nom']
          }]
        }
      ]
    });

    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Get section statistics
    const stats = await getSectionStats(id);

    sendSuccess(res, {
      ...section.toJSON(),
      stats
    });

  } catch (error) {
    console.error('Get section by ID error:', error);
    sendError(res, 'Failed to retrieve section', 500, error.message);
  }
};

// GET /api/sections/:id/users
const getSectionUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Verify section exists
    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    const { count, rows } = await User.findAndCountAll({
      where: { section_id: id },
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nom', 'ASC']]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get section users error:', error);
    sendError(res, 'Failed to retrieve section users', 500, error.message);
  }
};

// GET /api/sections/:id/interventions
const getSectionInterventions = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 10,
      statut,
      urgence,
      dateFrom,
      dateTo 
    } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (statut) whereClause.statut = statut;
    if (urgence !== undefined) whereClause.urgence = urgence === 'true';
    
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = dateFrom;
      if (dateTo) whereClause.date[Op.lte] = dateTo;
    }

    // Get interventions created by users in this section
    const { count, rows } = await Intervention.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creerPar',
          where: { section_id: id },
          attributes: ['id', 'nom']
        },
        {
          model: Equipment,
          as: 'equipement',
          attributes: ['id', 'nom', 'type_equipement'],
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['id', 'nom_entreprise']
          }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get section interventions error:', error);
    sendError(res, 'Failed to retrieve section interventions', 500, error.message);
  }
};

// GET /api/sections/:id/equipment
const getSectionEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get equipment that has interventions by this section
    const equipment = await sequelize.query(`
      SELECT DISTINCT
        e.id,
        e.nom,
        e.marque,
        e.modele,
        e.type_equipement,
        e.cout,
        c.nom_entreprise as client_nom,
        COUNT(DISTINCT i.id) as intervention_count,
        MAX(i.date) as last_intervention_date
      FROM Equipement e
      JOIN Client c ON e.proprietaire_id = c.id
      JOIN Intervention i ON e.id = i.equipement_id
      JOIN Utilisateur u ON i.creerPar_id = u.id
      WHERE u.section_id = :sectionId
      GROUP BY e.id, e.nom, e.marque, e.modele, e.type_equipement, e.cout, c.nom_entreprise
      ORDER BY last_intervention_date DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { 
        sectionId: id,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const countResult = await sequelize.query(`
      SELECT COUNT(DISTINCT e.id) as total
      FROM Equipement e
      JOIN Intervention i ON e.id = i.equipement_id
      JOIN Utilisateur u ON i.creerPar_id = u.id
      WHERE u.section_id = :sectionId
    `, {
      replacements: { sectionId: id },
      type: sequelize.QueryTypes.SELECT
    });

    const total = countResult[0]?.total || 0;

    sendPaginatedResponse(res, equipment, page, limit, total);

  } catch (error) {
    console.error('Get section equipment error:', error);
    sendError(res, 'Failed to retrieve section equipment', 500, error.message);
  }
};

// POST /api/sections
const createSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, type, responsable_id } = req.body;

    // Check if section name already exists
    const existingSection = await Section.findOne({ where: { nom } });
    if (existingSection) {
      return sendError(res, 'Section name already exists', 400);
    }

    // Validate responsible user if provided
    if (responsable_id) {
      const user = await User.findByPk(responsable_id);
      if (!user) {
        return sendError(res, 'Invalid responsible user', 400);
      }
    }

    const section = await Section.create({
      nom,
      type,
      responsable_id
    });

    const createdSection = await Section.findByPk(section.id, {
      include: [{
        model: User,
        as: 'responsable',
        attributes: ['id', 'nom', 'username']
      }]
    });

    sendSuccess(res, createdSection, 'Section created successfully', 201);

  } catch (error) {
    console.error('Create section error:', error);
    sendError(res, 'Failed to create section', 500, error.message);
  }
};

// PUT /api/sections/:id
const updateSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom, type, responsable_id } = req.body;

    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Check if new name conflicts with existing
    if (nom && nom !== section.nom) {
      const existingSection = await Section.findOne({ 
        where: { 
          nom,
          id: { [Op.ne]: id }
        } 
      });
      if (existingSection) {
        return sendError(res, 'Section name already exists', 400);
      }
    }

    // Validate responsible user if provided
    if (responsable_id !== undefined) {
      if (responsable_id) {
        const user = await User.findByPk(responsable_id);
        if (!user) {
          return sendError(res, 'Invalid responsible user', 400);
        }
        
        // Update the user's section_id to this section
        await user.update({ section_id: id });
      }
    }

    await section.update({
      ...(nom !== undefined && { nom }),
      ...(type !== undefined && { type }),
      ...(responsable_id !== undefined && { responsable_id })
    });

    const updatedSection = await Section.findByPk(id, {
      include: [{
        model: User,
        as: 'responsable',
        attributes: ['id', 'nom', 'username']
      }]
    });

    sendSuccess(res, updatedSection, 'Section updated successfully');

  } catch (error) {
    console.error('Update section error:', error);
    sendError(res, 'Failed to update section', 500, error.message);
  }
};

// DELETE /api/sections/:id
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Check for users in this section
    const userCount = await User.count({ where: { section_id: id } });
    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete section. ${userCount} users are assigned to this section.`, 
        400
      );
    }

    await section.destroy();

    sendSuccess(res, null, 'Section deleted successfully');

  } catch (error) {
    console.error('Delete section error:', error);
    sendError(res, 'Failed to delete section', 500, error.message);
  }
};

// GET /api/sections/:id/stats
const getSectionStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    const stats = await getSectionStats(id);

    sendSuccess(res, stats);

  } catch (error) {
    console.error('Get section statistics error:', error);
    sendError(res, 'Failed to retrieve section statistics', 500, error.message);
  }
};

// Helper function to get section statistics
const getSectionStats = async (sectionId) => {
  const [statsResult] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT i.id) as total_interventions,
      COUNT(DISTINCT CASE WHEN i.statut IN ('PLANIFIEE', 'EN_COURS', 'EN_ATTENTE_PDR', 'EN_PAUSE') THEN i.id END) as active_interventions,
      COUNT(DISTINCT CASE WHEN i.statut = 'TERMINEE' THEN i.id END) as completed_interventions,
      COUNT(DISTINCT CASE WHEN i.urgence = true AND i.statut NOT IN ('TERMINEE', 'ANNULEE') THEN i.id END) as urgent_interventions,
      COUNT(DISTINCT e.id) as equipment_count,
      COUNT(DISTINCT c.id) as client_count
    FROM Section s
    LEFT JOIN Utilisateur u ON s.id = u.section_id
    LEFT JOIN Intervention i ON u.id = i.creerPar_id
    LEFT JOIN Equipement e ON i.equipement_id = e.id
    LEFT JOIN Client c ON e.proprietaire_id = c.id
    WHERE s.id = :sectionId
  `, {
    replacements: { sectionId },
    type: sequelize.QueryTypes.SELECT
  });

  return statsResult || {
    user_count: 0,
    total_interventions: 0,
    active_interventions: 0,
    completed_interventions: 0,
    urgent_interventions: 0,
    equipment_count: 0,
    client_count: 0
  };
};

module.exports = {
  getAllSections,
  getSectionById,
  getSectionUsers,
  getSectionInterventions,
  getSectionEquipment,
  createSection,
  updateSection,
  deleteSection,
  getSectionStatistics
};