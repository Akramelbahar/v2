const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Role, Permission } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// Helper function to get user with complete role and permissions
const getUserWithRoleAndPermissions = async (userId) => {
  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{
      model: Role,
      as: 'role',
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }]
    }]
  });
};

// Format user response
const formatUserResponse = (user) => {
  if (!user) return null;
  
  const userObj = user.toJSON();
  const permissions = user.role?.permissions?.map(p => `${p.module}:${p.action}`) || [];
  
  return {
    id: userObj.id,
    nom: userObj.nom,
    username: userObj.username,
    section: userObj.section,
    role: userObj.role?.nom || null,
    roleId: userObj.role?.id || null,
    permissions,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role,
      section,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { section: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role filter
    if (role) {
      whereClause['$role.nom$'] = role;
    }

    // Section filter
    if (section) {
      whereClause.section = section;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action'],
          through: { attributes: [] }
        }]
      }],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    const formattedUsers = rows.map(user => formatUserResponse(user));

    sendPaginatedResponse(res, formattedUsers, page, limit, count);

  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserWithRoleAndPermissions(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const formattedUser = formatUserResponse(user);
    sendSuccess(res, formattedUser);

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
      role_id: role_id || 1
    });

    // Get user with complete role and permissions
    const userWithRole = await getUserWithRoleAndPermissions(user.id);
    const formattedUser = formatUserResponse(userWithRole);

    sendSuccess(res, formattedUser, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Username already exists', 400);
    }
    sendError(res, 'Failed to create user', 500, error.message);
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
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

    // Check if trying to update username (not allowed)
    if (req.body.username && req.body.username !== user.username) {
      return sendError(res, 'Username cannot be changed', 400);
    }

    // Validate new role if provided
    if (role_id && role_id !== user.role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Update user fields
    const updateData = {};
    if (nom !== undefined) updateData.nom = nom;
    if (section !== undefined) updateData.section = section;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (password) updateData.password = password;

    await user.update(updateData);

    // Get updated user with role and permissions
    const updatedUser = await getUserWithRoleAndPermissions(id);
    const formattedUser = formatUserResponse(updatedUser);

    sendSuccess(res, formattedUser, 'User updated successfully');

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

    // Check for dependencies (interventions, clients, equipment created by this user)
    const dependencies = await Promise.all([
      user.countInterventionsCrees?.() || 0,
      user.countClientsCrees?.() || 0,
      user.countEquipementsAjoutes?.() || 0
    ]);

    const totalDependencies = dependencies.reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      return sendError(res, 
        `Cannot delete user. User has ${totalDependencies} associated records (interventions, clients, equipment).`, 
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

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Prevent changing own status
    if (parseInt(id) === req.userId) {
      return sendError(res, 'Cannot change your own status', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    await user.update({ status });

    const updatedUser = await getUserWithRoleAndPermissions(id);
    const formattedUser = formatUserResponse(updatedUser);

    sendSuccess(res, formattedUser, 'User status updated successfully');

  } catch (error) {
    console.error('Update user status error:', error);
    sendError(res, 'Failed to update user status', 500, error.message);
  }
};

// GET /api/admin/users/stats
const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.findAll({
        attributes: [
          [sequelize.col('role.nom'), 'role'],
          [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']
        ],
        include: [{
          model: Role,
          as: 'role',
          attributes: []
        }],
        group: ['role.id', 'role.nom'],
        raw: true
      }),
      User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      recentUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role || 'No Role'] = parseInt(item.count);
        return acc;
      }, {})
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
  updateUserStatus,
  getUserStats
};