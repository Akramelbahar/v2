const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Role, Permission, User, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/roles - List roles with user count and permissions
const getAllRoles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'id',
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (search) {
      whereClause.nom = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description'],
          through: { attributes: [] }
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Utilisateur
              WHERE Utilisateur.role_id = Role.id
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
    console.error('Get roles error:', error);
    sendError(res, 'Failed to retrieve roles', 500, error.message);
  }
};

// POST /api/roles - Create role with permissions
const createRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, permissions = [] } = req.body;

    // Create role
    const role = await Role.create({ nom }, { transaction });

    // Add permissions if provided
    if (permissions.length > 0) {
      const permissionRecords = await Permission.findAll({
        where: { id: { [Op.in]: permissions } },
        transaction
      });
      
      await role.setPermissions(permissionRecords, { transaction });
    }

    await transaction.commit();

    // Reload with associations
    const createdRole = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }]
    });

    sendSuccess(res, createdRole, 'Role created successfully', 201);
  } catch (error) {
    await transaction.rollback();
    console.error('Create role error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Role name already exists', 400);
    }
    sendError(res, 'Failed to create role', 500, error.message);
  }
};

// PUT /api/roles/:id - Update role and permissions
const updateRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom, permissions = [] } = req.body;

    const role = await Role.findByPk(id, { transaction });
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Update role name
    await role.update({ nom }, { transaction });

    // Update permissions
    const permissionRecords = await Permission.findAll({
      where: { id: { [Op.in]: permissions } },
      transaction
    });
    
    await role.setPermissions(permissionRecords, { transaction });

    await transaction.commit();

    // Reload with associations
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }]
    });

    sendSuccess(res, updatedRole, 'Role updated successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Update role error:', error);
    sendError(res, 'Failed to update role', 500, error.message);
  }
};

// GET /api/permissions - Get all permissions organized by module
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    // Organize permissions by module
    const permissionMatrix = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    sendSuccess(res, { permissions, permissionMatrix });
  } catch (error) {
    console.error('Get permissions error:', error);
    sendError(res, 'Failed to retrieve permissions', 500, error.message);
  }
};

// POST /api/users/:id/assign-role - Assign role to user
const assignUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, approval_reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Update user role
    await user.update({ role_id });

    // Log role assignment (implement audit trail)
    // await AuditLog.create({
    //   action: 'ROLE_ASSIGNMENT',
    //   entity: 'User',
    //   entityId: id,
    //   performedBy: req.userId,
    //   changes: { old_role: user.role_id, new_role: role_id },
    //   reason: approval_reason
    // });

    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }]
    });

    sendSuccess(res, updatedUser, 'Role assigned successfully');
  } catch (error) {
    console.error('Assign role error:', error);
    sendError(res, 'Failed to assign role', 500, error.message);
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  getAllPermissions,
  assignUserRole
};