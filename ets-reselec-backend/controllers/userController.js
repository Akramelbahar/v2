const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Role, Section, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/users - List users with roles and sections
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role_id,
      section_id,
      status = 'active',
      sortBy = 'id',
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { section: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role_id) {
      whereClause.role_id = role_id;
    }

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom', 'type']
        }
      ],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    sendPaginatedResponse(res, rows, page, limit, count);
  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
};

// GET /api/users/:id - Get user details
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'module', 'action', 'description']
          }]
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom', 'type']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    sendError(res, 'Failed to retrieve user', 500, error.message);
  }
};

// POST /api/users - Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const userData = {
      ...req.body,
      role_id: req.body.role_id || 1 // Default to basic role
    };

    const user = await User.create(userData);

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ]
    });

    sendSuccess(res, createdUser, 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Username already exists', 400);
    }
    sendError(res, 'Failed to create user', 500, error.message);
  }
};

// PUT /api/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { password, ...updateData } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update user (password will be hashed by model hook if provided)
    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ]
    });

    sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500, error.message);
  }
};

// DELETE /api/users/:id - Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.userId) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check for dependencies
    const clientCount = await Client.count({ where: { cree_par_id: id } });
    const equipmentCount = await Equipment.count({ where: { ajouterPar_id: id } });
    
    if (clientCount > 0 || equipmentCount > 0) {
      return sendError(res, 
        `Cannot delete user. User has created ${clientCount} clients and ${equipmentCount} equipment items.`, 
        400
      );
    }

    await user.destroy();
    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};