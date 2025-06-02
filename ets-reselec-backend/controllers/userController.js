// ets-reselec-backend/controllers/userController.js
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/users
const getAllUsers = async (req, res) => {
  try {
    // Import models inside the function to avoid circular dependency issues
    const { User, Role, Permission, sequelize } = require('../models');
    const { Op } = require('sequelize');
    
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role_id,
      section,
      enabled,
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
      whereClause.role_id = parseInt(role_id);
    }

    if (section) {
      whereClause.section = section;
    }

    if (enabled !== undefined) {
      whereClause.enabled = enabled === 'true';
    }

    // Execute query
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom'],
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description'],
          through: { attributes: [] }
        }]
      }],
      attributes: { 
        exclude: ['password']
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    // Add enabled field if not present
    const formattedRows = rows.map(user => ({
      ...user.toJSON(),
      enabled: user.enabled !== undefined ? user.enabled : true,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    }));

    sendPaginatedResponse(res, formattedRows, page, limit, count);

  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { User, Role, Permission, Section, sequelize } = require('../models');
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'module', 'action', 'description'],
            through: { attributes: [] }
          }]
        }
      ]
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get user statistics - simplified version
    let stats = { totalInterventions: 0, totalEquipment: 0, totalClients: 0 };
    
    try {
      const statsResult = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM Intervention WHERE creerPar_id = ?) as totalInterventions,
          (SELECT COUNT(*) FROM Equipement WHERE ajouterPar_id = ?) as totalEquipment,
          (SELECT COUNT(*) FROM Client WHERE cree_par_id = ?) as totalClients
      `, {
        replacements: [id, id, id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (statsResult && statsResult[0]) {
        stats = statsResult[0];
      }
    } catch (statsError) {
      console.error('Stats query error:', statsError);
    }

    const userData = {
      ...user.toJSON(),
      stats,
      enabled: user.enabled !== undefined ? user.enabled : true,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    };

    sendSuccess(res, userData);

  } catch (error) {
    console.error('Get user by ID error:', error);
    sendError(res, 'Failed to retrieve user', 500, error.message);
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { User, Role } = require('../models');
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, username, password, section, role_id } = req.body;

    // Check if username already exists
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

    // Add enabled field to database if it doesn't exist
    try {
      const { sequelize } = require('../models');
      await sequelize.query(`
        ALTER TABLE Utilisateur 
        ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE
      `);
      
      await sequelize.query(`
        UPDATE Utilisateur 
        SET enabled = TRUE 
        WHERE id = ? AND enabled IS NULL
      `, {
        replacements: [user.id]
      });
    } catch (alterError) {
      console.log('Column might already exist:', alterError.message);
    }

    // Reload with associations
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }]
    });

    sendSuccess(res, {
      ...createdUser.toJSON(),
      enabled: true
    }, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', 500, error.message);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { User, Role } = require('../models');
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom, section, role_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Prevent users from modifying their own role
    if (req.userId === parseInt(id) && role_id && role_id !== user.role_id) {
      return sendError(res, 'Cannot modify your own role', 403);
    }

    // Validate new role if provided
    if (role_id && role_id !== user.role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Update user
    await user.update({
      nom,
      section,
      role_id
    });

    // Reload with associations
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }]
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
    const { User, Intervention } = require('../models');
    const { id } = req.params;

    // Prevent self-deletion
    if (req.userId === parseInt(id)) {
      return sendError(res, 'Cannot delete your own account', 403);
    }

    // Prevent deletion of main admin (ID: 1)
    if (parseInt(id) === 1) {
      return sendError(res, 'Cannot delete the main administrator account', 403);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check for dependencies
    const interventionCount = await Intervention.count({
      where: { creerPar_id: id }
    });

    if (interventionCount > 0) {
      return sendError(res, 
        `Cannot delete user. ${interventionCount} interventions are associated with this user.`, 
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

// PUT /api/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { User, Role, Permission } = require('../models');
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return sendError(res, 'Role ID is required', 400);
    }

    // Prevent users from modifying their own role
    if (req.userId === parseInt(id)) {
      return sendError(res, 'Cannot modify your own role', 403);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return sendError(res, 'Invalid role specified', 400);
    }

    await user.update({ role_id });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action'],
          through: { attributes: [] }
        }]
      }]
    });

    sendSuccess(res, updatedUser, 'User role updated successfully');

  } catch (error) {
    console.error('Update user role error:', error);
    sendError(res, 'Failed to update user role', 500, error.message);
  }
};

// POST /api/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { User } = require('../models');
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Generate a new random password
    const newPassword = crypto.randomBytes(8).toString('hex');
    
    // Update user password
    user.password = newPassword;
    await user.save();

    // In a real application, you would send this password via email
    // For now, we'll return it in the response (only in development)
    const responseData = {
      message: 'Password reset successfully'
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.temporaryPassword = newPassword;
    }

    sendSuccess(res, responseData, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password', 500, error.message);
  }
};

// PUT /api/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const { User, sequelize } = require('../models');
    const { id } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      return sendError(res, 'Enabled status is required', 400);
    }

    // Prevent users from disabling themselves
    if (req.userId === parseInt(id) && !enabled) {
      return sendError(res, 'Cannot disable your own account', 403);
    }

    // Prevent disabling main admin
    if (parseInt(id) === 1 && !enabled) {
      return sendError(res, 'Cannot disable the main administrator account', 403);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Add enabled column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE Utilisateur 
        ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE
      `);
    } catch (alterError) {
      console.log('Column might already exist:', alterError.message);
    }

    await sequelize.query(`
      UPDATE Utilisateur 
      SET enabled = ? 
      WHERE id = ?
    `, {
      replacements: [enabled, id]
    });

    sendSuccess(res, { id, enabled }, 'User status updated successfully');

  } catch (error) {
    console.error('Toggle user status error:', error);
    sendError(res, 'Failed to update user status', 500, error.message);
  }
};

// GET /api/users/:id/permissions
const getUserPermissions = async (req, res) => {
  try {
    const { User, Role, Permission } = require('../models');
    const { id } = req.params;

    const user = await User.findByPk(id, {
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

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const permissions = user.role?.permissions || [];
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push({
        action: permission.action,
        description: permission.description
      });
      return acc;
    }, {});

    sendSuccess(res, {
      role: user.role?.nom,
      permissions: groupedPermissions,
      permissionsList: permissions.map(p => `${p.module}:${p.action}`)
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    sendError(res, 'Failed to retrieve user permissions', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  toggleUserStatus,
  getUserPermissions
};