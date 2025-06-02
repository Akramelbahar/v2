// ets-reselec-backend/controllers/sectionController.js
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Section, User, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/sections
const getAllSections = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type,
      sortBy = 'nom',
      sortOrder = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    // Execute query
    const { count, rows } = await Section.findAndCountAll({
      where: whereClause,
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

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
          attributes: ['id', 'nom', 'username', 'section'],
          include: [{
            model: sequelize.models.Role,
            as: 'role',
            attributes: ['id', 'nom']
          }]
        }
      ]
    });

    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    sendSuccess(res, section);

  } catch (error) {
    console.error('Get section by ID error:', error);
    sendError(res, 'Failed to retrieve section', 500, error.message);
  }
};

// POST /api/sections
const createSection = async (req, res) => {
  try {
    // Check validation errors
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

    // Validate responsable exists if provided
    if (responsable_id) {
      const responsable = await User.findByPk(responsable_id);
      if (!responsable) {
        return sendError(res, 'Responsible user not found', 404);
      }
    }

    // Create section
    const section = await Section.create({
      nom,
      type,
      responsable_id
    });
    
    // Reload with associations
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
    // Check validation errors
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

    // Check if new name already exists
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

    // Validate new responsable if provided
    if (responsable_id !== undefined && responsable_id !== section.responsable_id) {
      if (responsable_id) {
        const responsable = await User.findByPk(responsable_id);
        if (!responsable) {
          return sendError(res, 'Responsible user not found', 404);
        }
      }
    }

    // Update section
    await section.update({
      nom: nom || section.nom,
      type: type !== undefined ? type : section.type,
      responsable_id: responsable_id !== undefined ? responsable_id : section.responsable_id
    });

    // Reload with associations
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

    // Check if section has users
    const userCount = await User.count({ where: { section_id: id } });
    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete section. ${userCount} user(s) are assigned to this section.`, 
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

// GET /api/sections/types
const getSectionTypes = async (req, res) => {
  try {
    const types = await Section.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('type')), 'type']
      ],
      where: {
        type: { [Op.not]: null }
      },
      order: [['type', 'ASC']]
    });

    const typeList = types
      .map(t => t.type)
      .filter(Boolean);

    sendSuccess(res, typeList);

  } catch (error) {
    console.error('Get section types error:', error);
    sendError(res, 'Failed to retrieve section types', 500, error.message);
  }
};

module.exports = {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionTypes
};