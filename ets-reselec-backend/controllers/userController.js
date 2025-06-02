// ets-reselec-backend/controllers/userController.js
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Role, Section, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role_id,
      section_id,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Build where clause
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

    // Execute query
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

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          include: [{
            model: sequelize.models.Permission,
            as: 'permissions',
            attributes: ['id', 'module', 'action', 'description']
          }]
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom', 'type']
        }
      ]
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

// POST /api/users
const createUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { username } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return sendError(res, 'Username already exists', 400);
    }

    // Create user
    const user = await User.create(req.body);
    
    // Reload with associations
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
          attributes: ['id', 'nom', 'type']
        }
      ]
    });

    sendSuccess(res, createdUser, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', 500, error.message);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { username, password, ...updateData } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if new username is already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingUser) {
        return sendError(res, 'Username already exists', 400);
      }
      
      updateData.username = username;
    }

    // If password is provided, it will be hashed by the model hook
    if (password) {
      updateData.password = password;
    }

    // Update user
    await user.update(updateData);

    // Reload with associations
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
          attributes: ['id', 'nom', 'type']
        }
      ]
    });

    sendSuccess(res, updatedUser, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500, error.message);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Prevent deleting the last admin
    if (user.role_id === 1) { // Assuming 1 is Admin role
      const adminCount = await User.count({ where: { role_id: 1 } });
      if (adminCount <= 1) {
        return sendError(res, 'Cannot delete the last administrator', 400);
      }
    }

    // Prevent self-deletion
    if (user.id === req.userId) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    await user.destroy();

    sendSuccess(res, null, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500, error.message);
  }
};

// PUT /api/users/:id/change-password
const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update password (will be hashed by model hook)
    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword
};