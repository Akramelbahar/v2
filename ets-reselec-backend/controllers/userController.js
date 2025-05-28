const { validationResult } = require('express-validator');
const { Op, sequelize } = require('sequelize'); // Import sequelize here
const { User, Role, Permission } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role_id,
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

    // Execute query
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description']
        }]
      }],
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

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description']
        }]
      }]
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

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, username, password, section, role_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return sendError(res, 'Username already exists', 400);
    }

    // Validate role exists
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Create user
    const user = await User.create({
      nom,
      username,
      password,
      section,
      role_id: role_id || 1 // Default to basic role
    });

    // Reload with associations
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description']
        }]
      }]
    });

    sendSuccess(res, createdUser, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', 500, error.message);
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom, section, role_id, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Validate role exists if provided
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Update user
    const updateData = { nom, section, role_id };
    if (password) {
      updateData.password = password; // Will be hashed by the model hook
    }

    await user.update(updateData);

    // Reload with associations
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description']
        }]
      }]
    });

    sendSuccess(res, updatedUser, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500, error.message);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.userId) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    await user.destroy();

    sendSuccess(res, null, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500, error.message);
  }
};

// GET /api/admin/users/stats
const getUserStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.count();

    // Get users by role
    const usersByRole = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']
      ],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }],
      group: ['role.id', 'role.nom'],
      raw: true,
      nest: true
    });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Since we don't have createdAt, we'll just get the latest 10 users by ID
    const recentUsers = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['nom']
      }],
      order: [['id', 'DESC']],
      limit: 10
    });

    const stats = {
      totalUsers,
      usersByRole: usersByRole.map(item => ({
        role: item.role.nom,
        count: parseInt(item.count)
      })),
      recentUsers
    };

    sendSuccess(res, stats);

  } catch (error) {
    console.error('Get user stats error:', error);
    sendError(res, 'Failed to retrieve user statistics', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};