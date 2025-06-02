// ets-reselec-backend/controllers/roleController.js
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
      includePermissions = false,
      sortBy = 'id',
      sortOrder = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (search) {
      whereClause.nom = { [Op.like]: `%${search}%` };
    }

    const includeOptions = [];
    
    if (includePermissions === 'true') {
      includeOptions.push({
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['id', 'module', 'action', 'description']
      });
    }

    // Get roles with pagination
    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: includeOptions,
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
          through: { attributes: [] },
          attributes: ['id', 'module', 'action', 'description']
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

// POST /api/roles
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

    // Check if role name already exists
    const existingRole = await Role.findOne({ where: { nom } });
    if (existingRole) {
      await transaction.rollback();
      return sendError(res, 'Role name already exists', 400);
    }

    // Create role
    const role = await Role.create({ nom }, { transaction });

    // Assign permissions if provided
    if (permissions.length > 0) {
      await role.setPermissions(permissions, { transaction });
    }

    await transaction.commit();

    // Reload with associations
    const createdRole = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['id', 'module', 'action', 'description']
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
    // Check validation errors
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

    // Prevent updating system roles
    if (role.nom === 'Administrateur') {
      await transaction.rollback();
      return sendError(res, 'Cannot modify the Administrator role', 400);
    }

    // Check if new name already exists
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
      
      role.nom = nom;
      await role.save({ transaction });
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      await role.setPermissions(permissions, { transaction });
    }

    await transaction.commit();

    // Reload with associations
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['id', 'module', 'action', 'description']
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

    // Prevent deleting system roles
    if (['Administrateur', 'Chef de Section', 'Technicien Senior', 'Technicien Junior', 'Observateur'].includes(role.nom)) {
      return sendError(res, 'Cannot delete system roles', 400);
    }

    // Check if role is in use
    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      return sendError(res, `Cannot delete role. ${userCount} user(s) are assigned to this role.`, 400);
    }

    await role.destroy();

    sendSuccess(res, null, 'Role deleted successfully');

  } catch (error) {
    console.error('Delete role error:', error);
    sendError(res, 'Failed to delete role', 500, error.message);
  }
};

// GET /api/roles/:id/permissions
const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['id', 'module', 'action', 'description']
      }]
    });

    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    sendSuccess(res, role.permissions);

  } catch (error) {
    console.error('Get role permissions error:', error);
    sendError(res, 'Failed to retrieve role permissions', 500, error.message);
  }
};

// PUT /api/roles/:id/permissions
const updateRolePermissions = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      await transaction.rollback();
      return sendError(res, 'Role not found', 404);
    }

    // Update permissions
    await role.setPermissions(permissions, { transaction });

    await transaction.commit();

    // Reload with updated permissions
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        attributes: ['id', 'module', 'action', 'description']
      }]
    });

    sendSuccess(res, updatedRole.permissions, 'Permissions updated successfully');

  } catch (error) {
    await transaction.rollback();
    console.error('Update role permissions error:', error);
    sendError(res, 'Failed to update permissions', 500, error.message);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions
};