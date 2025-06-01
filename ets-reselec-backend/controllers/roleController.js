// ets-reselec-backend/controllers/roleController.js
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Role, Permission, User, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// GET /api/roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
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
      order: [['id', 'ASC']]
    });

    // Add timestamps for consistency
    const formattedRoles = roles.map(role => ({
      ...role.toJSON(),
      createdAt: role.createdAt || new Date().toISOString(),
      updatedAt: role.updatedAt || new Date().toISOString()
    }));

    sendSuccess(res, formattedRoles);

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
        }
      ]
    });

    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Get users with this role
    const users = await User.findAll({
      where: { role_id: id },
      attributes: ['id', 'nom', 'username', 'section'],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['nom']
      }]
    });

    const roleData = {
      ...role.toJSON(),
      users,
      userCount: users.length,
      createdAt: role.createdAt || new Date().toISOString(),
      updatedAt: role.updatedAt || new Date().toISOString()
    };

    sendSuccess(res, roleData);

  } catch (error) {
    console.error('Get role by ID error:', error);
    sendError(res, 'Failed to retrieve role', 500, error.message);
  }
};

// POST /api/roles
const createRole = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom } = req.body;

    // Check if role name already exists
    const existingRole = await Role.findOne({ where: { nom } });
    if (existingRole) {
      return sendError(res, 'Role name already exists', 400);
    }

    // Create role
    const role = await Role.create({ nom });

    sendSuccess(res, role, 'Role created successfully', 201);

  } catch (error) {
    console.error('Create role error:', error);
    sendError(res, 'Failed to create role', 500, error.message);
  }
};

// PUT /api/roles/:id
const updateRole = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom } = req.body;

    // Prevent modifying system roles
    if (parseInt(id) === 1) {
      return sendError(res, 'Cannot modify the Administrator role', 403);
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if new name already exists
    if (nom !== role.nom) {
      const existingRole = await Role.findOne({ 
        where: { 
          nom,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingRole) {
        return sendError(res, 'Role name already exists', 400);
      }
    }

    // Update role
    await role.update({ nom });

    sendSuccess(res, role, 'Role updated successfully');

  } catch (error) {
    console.error('Update role error:', error);
    sendError(res, 'Failed to update role', 500, error.message);
  }
};

// DELETE /api/roles/:id
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting system roles
    if (parseInt(id) === 1) {
      return sendError(res, 'Cannot delete the Administrator role', 403);
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if role has users
    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete role. ${userCount} users are assigned to this role.`, 
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

// GET /api/permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'module', 'action', 'description'],
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    sendSuccess(res, permissions);

  } catch (error) {
    console.error('Get permissions error:', error);
    sendError(res, 'Failed to retrieve permissions', 500, error.message);
  }
};

// PUT /api/roles/:id/permissions
const updateRolePermissions = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { permission_ids = [] } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Validate all permission IDs exist
    if (permission_ids.length > 0) {
      const validPermissions = await Permission.count({
        where: { id: permission_ids }
      });
      
      if (validPermissions !== permission_ids.length) {
        await transaction.rollback();
        return sendError(res, 'Some permission IDs are invalid', 400);
      }
    }

    // Remove all existing permissions
    await sequelize.query(
      'DELETE FROM Role_Permission WHERE role_id = ?',
      { 
        replacements: [id],
        transaction 
      }
    );

    // Add new permissions
    if (permission_ids.length > 0) {
      const values = permission_ids.map(permId => `(${id}, ${permId})`).join(',');
      await sequelize.query(
        `INSERT INTO Role_Permission (role_id, permission_id) VALUES ${values}`,
        { transaction }
      );
    }

    await transaction.commit();

    // Reload role with updated permissions
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }]
    });

    sendSuccess(res, updatedRole, 'Role permissions updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Update role permissions error:', error);
    sendError(res, 'Failed to update role permissions', 500, error.message);
  }
};

// GET /api/roles/:id/users
const getUsersByRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    const users = await User.findAll({
      where: { role_id: id },
      attributes: ['id', 'nom', 'username', 'section'],
      include: [{
        model: sequelize.models.Intervention,
        as: 'interventionsCrees',
        attributes: ['id'],
        required: false
      }],
      group: ['User.id'],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('interventionsCrees.id')), 'interventionCount']
        ]
      }
    });

    sendSuccess(res, {
      role: role.nom,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    sendError(res, 'Failed to retrieve users for role', 500, error.message);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  updateRolePermissions,
  getUsersByRole
};