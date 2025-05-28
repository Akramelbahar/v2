const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Role, Permission, User, sequelize } = require('../models');
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

    // Search filter
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
        },
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          required: false
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
          attributes: ['id', 'nom', 'username'],
          limit: 10
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
      }
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
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, permissions = [] } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ 
      where: { nom },
      transaction 
    });
    
    if (existingRole) {
      await transaction.rollback();
      return sendError(res, 'Role name already exists', 400);
    }

    // Validate permissions exist
    if (permissions.length > 0) {
      const validPermissions = await Permission.findAll({
        where: { id: { [Op.in]: permissions } },
        transaction
      });
      
      if (validPermissions.length !== permissions.length) {
        await transaction.rollback();
        return sendError(res, 'One or more invalid permissions specified', 400);
      }
    }

    // Create role
    const role = await Role.create({ nom }, { transaction });

    // Assign permissions
    if (permissions.length > 0) {
      await role.setPermissions(permissions, { transaction });
    }

    await transaction.commit();

    // Reload with permissions
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
    const { nom, permissions = [] } = req.body;

    const role = await Role.findByPk(id, { transaction });
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Prevent updating system roles (optional safeguard)
    const systemRoles = ['Admin', 'Administrateur', 'Super Admin'];
    if (systemRoles.includes(role.nom) && nom !== role.nom) {
      await transaction.rollback();
      return sendError(res, 'Cannot modify system role name', 400);
    }

    // Check if new name already exists (if changing name)
    if (nom !== role.nom) {
      const existingRole = await Role.findOne({ 
        where: { 
          nom,
          id: { [Op.ne]: id }
        },
        transaction 
      });
      
      if (existingRole) {
        await transaction.rollback();
        return sendError(res, 'Role name already exists', 400);
      }
    }

    // Validate permissions exist
    if (permissions.length > 0) {
      const validPermissions = await Permission.findAll({
        where: { id: { [Op.in]: permissions } },
        transaction
      });
      
      if (validPermissions.length !== permissions.length) {
        await transaction.rollback();
        return sendError(res, 'One or more invalid permissions specified', 400);
      }
    }

    // Update role
    await role.update({ nom }, { transaction });

    // Update permissions
    await role.setPermissions(permissions, { transaction });

    await transaction.commit();

    // Reload with permissions
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

    // Prevent deleting system roles
    const systemRoles = ['Admin', 'Administrateur', 'Super Admin'];
    if (systemRoles.includes(role.nom)) {
      return sendError(res, 'Cannot delete system role', 400);
    }

    // Check for users with this role
    const userCount = await User.count({
      where: { role_id: id }
    });

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
    const { groupBy = 'module' } = req.query;

    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    if (groupBy === 'module') {
      // Group permissions by module
      const groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.module;
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      }, {});

      sendSuccess(res, groupedPermissions);
    } else {
      sendSuccess(res, permissions);
    }

  } catch (error) {
    console.error('Get permissions error:', error);
    sendError(res, 'Failed to retrieve permissions', 500, error.message);
  }
};

// POST /api/admin/permissions
const createPermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { module, action, description } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      where: { module, action }
    });

    if (existingPermission) {
      return sendError(res, 'Permission already exists for this module and action', 400);
    }

    const permission = await Permission.create({
      module,
      action,
      description
    });

    sendSuccess(res, permission, 'Permission created successfully', 201);

  } catch (error) {
    console.error('Create permission error:', error);
    sendError(res, 'Failed to create permission', 500, error.message);
  }
};

// PUT /api/admin/permissions/:id
const updatePermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { module, action, description } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return sendError(res, 'Permission not found', 404);
    }

    // Check if updated permission combination already exists
    if (module !== permission.module || action !== permission.action) {
      const existingPermission = await Permission.findOne({
        where: { 
          module, 
          action,
          id: { [Op.ne]: id }
        }
      });

      if (existingPermission) {
        return sendError(res, 'Permission already exists for this module and action', 400);
      }
    }

    await permission.update({ module, action, description });

    sendSuccess(res, permission, 'Permission updated successfully');

  } catch (error) {
    console.error('Update permission error:', error);
    sendError(res, 'Failed to update permission', 500, error.message);
  }
};

// DELETE /api/admin/permissions/:id
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return sendError(res, 'Permission not found', 404);
    }

    // Check if permission is assigned to any roles
    const rolesWithPermission = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions',
        where: { id },
        through: { attributes: [] }
      }]
    });

    if (rolesWithPermission.length > 0) {
      const roleNames = rolesWithPermission.map(role => role.nom).join(', ');
      return sendError(res, 
        `Cannot delete permission. It is assigned to the following roles: ${roleNames}`, 
        400
      );
    }

    await permission.destroy();

    sendSuccess(res, null, 'Permission deleted successfully');

  } catch (error) {
    console.error('Delete permission error:', error);
    sendError(res, 'Failed to delete permission', 500, error.message);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
};