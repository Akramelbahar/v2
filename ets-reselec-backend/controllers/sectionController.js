const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Section, User, Intervention, Equipment, Client, Role, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/sections
const getAllSections = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      nom: { [Op.like]: `%${search}%` }
    } : {};

    const { count, rows } = await Section.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'responsable',
        attributes: ['id', 'nom', 'username']
      }],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT u.id)
              FROM Utilisateur u
              WHERE u.section_id = Section.id
            )`),
            'userCount'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT i.id)
              FROM Intervention i
              JOIN Utilisateur u ON i.creerPar_id = u.id
              WHERE u.section_id = Section.id
            )`),
            'interventionCount'
          ]
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nom', 'ASC']]
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
          attributes: ['id', 'nom', 'username', 'section']
        }
      ]
    });

    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Get intervention count through users
    const interventionCount = await Intervention.count({
      include: [{
        model: User,
        as: 'creerPar',
        where: { section_id: id },
        attributes: []
      }]
    });

    const sectionData = {
      ...section.toJSON(),
      interventionCount
    };

    sendSuccess(res, sectionData);
  } catch (error) {
    console.error('Get section by ID error:', error);
    sendError(res, 'Failed to retrieve section', 500, error.message);
  }
};

// POST /api/sections
const createSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, responsable_id } = req.body;

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

    const section = await Section.create({
      nom,
      responsable_id: responsable_id || null
    });

    // If responsable is set, update their section_id
    if (responsable_id) {
      await User.update(
        { section_id: section.id },
        { where: { id: responsable_id } }
      );
    }

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
    const { nom, responsable_id } = req.body;

    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Check if new name already exists
    if (nom && nom !== section.nom) {
      const existingSection = await Section.findOne({ 
        where: { nom, id: { [Op.ne]: id } } 
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
        // Update the responsable's section
        await User.update(
          { section_id: id },
          { where: { id: responsable_id } }
        );
      }
    }

    await section.update({
      nom: nom || section.nom,
      responsable_id: responsable_id !== undefined ? responsable_id : section.responsable_id
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

// GET /api/sections/users - Get all users for section assignment
const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nom', 'username', 'section_id'],
      include: [{
        model: Section,
        as: 'sectionBelongsTo',
        attributes: ['id', 'nom']
      }],
      order: [['nom', 'ASC']]
    });

    sendSuccess(res, users);
  } catch (error) {
    console.error('Get available users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
};

// POST /api/sections/:id/assign-users
const assignUsersToSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return sendError(res, 'User IDs must be an array', 400);
    }

    const section = await Section.findByPk(id);
    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    // Update users' section
    await User.update(
      { section_id: id },
      { where: { id: userIds } }
    );

    sendSuccess(res, null, 'Users assigned to section successfully');
  } catch (error) {
    console.error('Assign users error:', error);
    sendError(res, 'Failed to assign users', 500, error.message);
  }
};

module.exports = {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getAvailableUsers,
  assignUsersToSection
};