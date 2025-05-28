const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { Role, Permission, User } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/admin/roles
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
      whereClause.nom = { [sequelize.Sequelize.Op.like]: `%${search}%` };
    }

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description'],
          through: { attributes: [] } // Exclude junction table attributes
        },
        {
          model: User,
          as: 'users',
          attributes: ['id'] // Only get IDs to count users
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

// GET /api/admin/roles/:id
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'nom', 'username']
        }
      ]
    });

    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    sendSuccess(res, role);

  } catch (error) {
    console.error('Get role by ID error:', error);
    sendError(res, 'Failed to retrieve role', 500, error.message);
  }
};

// POST /api/admin/roles
const createRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, permissions = [] } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { nom } });
    if (existingRole) {
      await transaction.rollback();
      return sendError(res, 'Role already exists', 400);
    }

    // Create role
    const role = await Role.create({ nom }, { transaction });

    // Assign permissions if provided
    if (permissions.length > 0) {
      const permissionInstances = await Permission.findAll({
        where: { id: permissions },
        transaction
      });

      if (permissionInstances.length !== permissions.length) {
        await transaction.rollback();
        return sendError(res, 'Some permissions do not exist', 400);
      }

      await role.setPermissions(permissionInstances, { transaction });
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
    sendError(res, 'Failed to create role', 500, error.message);
  }
};

// PUT /api/admin/roles/:id
const updateRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Check if new name conflicts with existing role
    if (nom && nom !== role.nom) {
      const existingRole = await Role.findOne({ where: { nom } });
      if (existingRole) {
        await transaction.rollback();
        return sendError(res, 'Role name already exists', 400);
      }
    }

    // Update role
    if (nom) {
      await role.update({ nom }, { transaction });
    }

    // Update permissions if provided
    if (Array.isArray(permissions)) {
      if (permissions.length > 0) {
        const permissionInstances = await Permission.findAll({
          where: { id: permissions },
          transaction
        });

        if (permissionInstances.length !== permissions.length) {
          await transaction.rollback();
          return sendError(res, 'Some permissions do not exist', 400);
        }

        await role.setPermissions(permissionInstances, { transaction });
      } else {
        // Remove all permissions
        await role.setPermissions([], { transaction });
      }
    }

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

// DELETE /api/admin/roles/:id
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if role is in use
    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete role. ${userCount} user(s) are assigned to this role.`, 
        400
      );
    }

    await role.destroy();
    sendSuccess(res, null, 'Role deleted successfully');

  } catch (error) {
    console.error('Delete role error:', error);
    sendError(res, 'Failed to delete role', 500, error.message);
  }
};

// GET /api/admin/permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});

    sendSuccess(res, {
      permissions,
      groupedPermissions
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    sendError(res, 'Failed to retrieve permissions', 500, error.message);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions
};