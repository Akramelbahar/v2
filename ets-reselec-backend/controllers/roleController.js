const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Role, Permission, User, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/roles
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
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }],
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
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get roles error:', error);
    sendError(res, 'Failed to retrieve roles', 500, error.message);
  }
};

// GET /api/roles/:id
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
          limit: 10 // Limit users shown
        }
      ]
    });

    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Get total user count for this role
    const totalUsers = await User.count({
      where: { role_id: id }
    });

    const roleData = {
      ...role.toJSON(),
      totalUsers
    };

    sendSuccess(res, roleData);

  } catch (error) {
    console.error('Get role by ID error:', error);
    sendError(res, 'Failed to retrieve role', 500, error.message);
  }
};

// POST /api/roles
const createRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, permissions = [] } = req.body;

    // Check if role name already exists
    const existingRole = await Role.findOne({
      where: { nom }
    });

    if (existingRole) {
      await transaction.rollback();
      return sendError(res, 'Role name already exists', 400);
    }

    // Create role
    const role = await Role.create({ nom }, { transaction });

    // Add permissions if provided
    if (permissions.length > 0) {
      // Validate permissions exist
      const validPermissions = await Permission.findAll({
        where: { id: { [Op.in]: permissions } }
      });

      if (validPermissions.length !== permissions.length) {
        await transaction.rollback();
        return sendError(res, 'Some permissions are invalid', 400);
      }

      await role.setPermissions(permissions, { transaction });
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

// PUT /api/roles/:id
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
      const existingRole = await Role.findOne({
        where: { 
          nom,
          id: { [Op.ne]: id }
        }
      });

      if (existingRole) {
        await transaction.rollback();
        return sendError(res, 'Role name already exists', 400);
      }
    }

    // Update role name if provided
    if (nom) {
      await role.update({ nom }, { transaction });
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      if (permissions.length > 0) {
        // Validate permissions exist
        const validPermissions = await Permission.findAll({
          where: { id: { [Op.in]: permissions } }
        });

        if (validPermissions.length !== permissions.length) {
          await transaction.rollback();
          return sendError(res, 'Some permissions are invalid', 400);
        }
      }

      await role.setPermissions(permissions, { transaction });
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

// DELETE /api/roles/:id
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if role is used by any users
    const userCount = await User.count({
      where: { role_id: id }
    });

    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete role. ${userCount} user(s) are assigned to this role.`, 
        400
      );
    }

    // Don't allow deletion of system roles
    const systemRoles = ['Administrateur', 'Admin', 'Super Admin'];
    if (systemRoles.includes(role.nom)) {
      return sendError(res, 'Cannot delete system role', 400);
    }

    await role.destroy();

    sendSuccess(res, null, 'Role deleted successfully');

  } catch (error) {
    console.error('Delete role error:', error);
    sendError(res, 'Failed to delete role', 500, error.message);
  }
};

// GET /api/roles/permissions/all
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'module', 'action', 'description'],
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push({
        id: permission.id,
        action: permission.action,
        description: permission.description,
        fullName: `${module}:${permission.action}`
      });
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

// POST /api/roles/permissions
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
      return sendError(res, 'Permission already exists', 400);
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

// PUT /api/roles/permissions/:id
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

    // Check if updated combination already exists
    if ((module && module !== permission.module) || (action && action !== permission.action)) {
      const existingPermission = await Permission.findOne({
        where: { 
          module: module || permission.module,
          action: action || permission.action,
          id: { [Op.ne]: id }
        }
      });

      if (existingPermission) {
        return sendError(res, 'Permission combination already exists', 400);
      }
    }

    await permission.update({
      module: module || permission.module,
      action: action || permission.action,
      description: description !== undefined ? description : permission.description
    });

    sendSuccess(res, permission, 'Permission updated successfully');

  } catch (error) {
    console.error('Update permission error:', error);
    sendError(res, 'Failed to update permission', 500, error.message);
  }
};

// DELETE /api/roles/permissions/:id
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return sendError(res, 'Permission not found', 404);
    }

    // Check if permission is used by any roles
    const rolesWithPermission = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions',
        where: { id },
        attributes: ['id']
      }]
    });

    if (rolesWithPermission.length > 0) {
      return sendError(res, 
        `Cannot delete permission. It is assigned to ${rolesWithPermission.length} role(s).`, 
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

// POST /api/roles/:id/permissions
const assignPermissionsToRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Validate permissions exist
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.findAll({
        where: { id: { [Op.in]: permissions } }
      });

      if (validPermissions.length !== permissions.length) {
        await transaction.rollback();
        return sendError(res, 'Some permissions are invalid', 400);
      }
    }

    // Set permissions (this replaces all existing permissions)
    await role.setPermissions(permissions || [], { transaction });

    await transaction.commit();

    // Reload role with permissions
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }]
    });

    sendSuccess(res, updatedRole, 'Permissions assigned successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Assign permissions error:', error);
    sendError(res, 'Failed to assign permissions', 500, error.message);
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
  deletePermission,
  assignPermissionsToRole
};