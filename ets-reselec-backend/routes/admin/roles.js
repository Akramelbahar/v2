// ets-reselec-backend/routes/admin/roles.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../middleware/auth');
const { idValidation } = require('../../middleware/validation');
const { body, validationResult } = require('express-validator');
const { Role, Permission, User } = require('../../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// Validation rules for roles
const roleValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters')
  ],
  update: [
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Role name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters')
  ],
  assignPermissions: [
    body('permissions')
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .isInt({ min: 1 })
      .withMessage('Each permission must be a valid permission ID')
  ]
};

// GET /api/admin/roles - Get all roles with pagination
router.get('/', async (req, res) => {
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
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] }
      }],
      attributes: {
        include: [
          [
            // Count users with this role
            require('../../config/database').sequelize.literal(`(
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
});

// GET /api/admin/roles/:id - Get role by ID
router.get('/:id', idValidation, async (req, res) => {
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
          limit: 10 // Limit to prevent large responses
        }
      ]
    });

    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Get total user count for this role
    const userCount = await User.count({ where: { role_id: id } });
    
    const roleData = {
      ...role.toJSON(),
      totalUsers: userCount
    };

    sendSuccess(res, roleData);

  } catch (error) {
    console.error('Get role by ID error:', error);
    sendError(res, 'Failed to retrieve role', 500, error.message);
  }
});

// POST /api/admin/roles - Create new role
router.post('/', roleValidations.create, async (req, res) => {
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
});

// PUT /api/admin/roles/:id - Update role
router.put('/:id', [idValidation, ...roleValidations.update], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { nom } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if new name already exists (excluding current role)
    if (nom && nom !== role.nom) {
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
    await role.update({ nom: nom || role.nom });

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
    console.error('Update role error:', error);
    sendError(res, 'Failed to update role', 500, error.message);
  }
});

// DELETE /api/admin/roles/:id - Delete role
router.delete('/:id', idValidation, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Check if role is assigned to any users
    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      return sendError(res, 
        `Cannot delete role. ${userCount} user(s) are assigned to this role.`, 
        400
      );
    }

    // Prevent deletion of system roles
    const systemRoles = ['Administrateur', 'Admin'];
    if (systemRoles.includes(role.nom)) {
      return sendError(res, 'Cannot delete system role', 400);
    }

    await role.destroy();

    sendSuccess(res, null, 'Role deleted successfully');

  } catch (error) {
    console.error('Delete role error:', error);
    sendError(res, 'Failed to delete role', 500, error.message);
  }
});

// PUT /api/admin/roles/:id/permissions - Assign permissions to role
router.put('/:id/permissions', [idValidation, ...roleValidations.assignPermissions], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    // Verify all permissions exist
    const validPermissions = await Permission.findAll({
      where: { id: { [Op.in]: permissions } }
    });

    if (validPermissions.length !== permissions.length) {
      return sendError(res, 'One or more invalid permissions specified', 400);
    }

    // Assign permissions to role
    await role.setPermissions(validPermissions);

    // Reload role with updated permissions
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
    console.error('Assign permissions error:', error);
    sendError(res, 'Failed to assign permissions', 500, error.message);
  }
});

// GET /api/admin/roles/:id/users - Get users with specific role
router.get('/:id/users', idValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }

    const { count, rows } = await User.findAndCountAll({
      where: { role_id: id },
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nom']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nom', 'ASC']]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get role users error:', error);
    sendError(res, 'Failed to retrieve role users', 500, error.message);
  }
});

module.exports = router;