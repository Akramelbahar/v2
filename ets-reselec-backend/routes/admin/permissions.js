// ets-reselec-backend/routes/admin/permissions.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../middleware/auth');
const { idValidation } = require('../../middleware/validation');
const { body, validationResult } = require('express-validator');
const { Permission, Role } = require('../../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// Validation rules for permissions
const permissionValidations = {
  create: [
    body('module')
      .notEmpty()
      .withMessage('Module is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Module name must be between 2 and 100 characters'),
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Action name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],
  update: [
    body('module')
      .optional()
      .notEmpty()
      .withMessage('Module cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Module name must be between 2 and 100 characters'),
    body('action')
      .optional()
      .notEmpty()
      .withMessage('Action cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Action name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ]
};

// GET /api/admin/permissions - Get all permissions with pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      module = '',
      sortBy = 'module',
      sortOrder = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { module: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Module filter
    if (module) {
      whereClause.module = module;
    }

    const { count, rows } = await Permission.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'nom'],
        through: { attributes: [] }
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder], ['action', 'ASC']]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get permissions error:', error);
    sendError(res, 'Failed to retrieve permissions', 500, error.message);
  }
});

// GET /api/admin/permissions/modules - Get unique modules
router.get('/modules', async (req, res) => {
  try {
    const modules = await Permission.findAll({
      attributes: [
        [
          require('../../config/database').sequelize.fn('DISTINCT', 
          require('../../config/database').sequelize.col('module')), 
          'module'
        ]
      ],
      where: {
        module: { [Op.not]: null }
      },
      order: [['module', 'ASC']],
      raw: true
    });

    const moduleList = modules.map(m => m.module).filter(Boolean);

    sendSuccess(res, moduleList);

  } catch (error) {
    console.error('Get modules error:', error);
    sendError(res, 'Failed to retrieve modules', 500, error.message);
  }
});

// GET /api/admin/permissions/:id - Get permission by ID
router.get('/:id', idValidation, async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'nom'],
        through: { attributes: [] }
      }]
    });

    if (!permission) {
      return sendError(res, 'Permission not found', 404);
    }

    sendSuccess(res, permission);

  } catch (error) {
    console.error('Get permission by ID error:', error);
    sendError(res, 'Failed to retrieve permission', 500, error.message);
  }
});

// POST /api/admin/permissions - Create new permission
router.post('/', permissionValidations.create, async (req, res) => {
  try {
    // Check validation errors
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

    // Create permission
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
});

// PUT /api/admin/permissions/:id - Update permission
router.put('/:id', [idValidation, ...permissionValidations.update], async (req, res) => {
  try {
    // Check validation errors
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

    // Check if updated module/action combination already exists (excluding current permission)
    if ((module && module !== permission.module) || (action && action !== permission.action)) {
      const existingPermission = await Permission.findOne({
        where: {
          module: module || permission.module,
          action: action || permission.action,
          id: { [Op.ne]: id }
        }
      });
      if (existingPermission) {
        return sendError(res, 'Permission already exists for this module and action', 400);
      }
    }

    // Update permission
    await permission.update({
      module: module || permission.module,
      action: action || permission.action,
      description: description !== undefined ? description : permission.description
    });

    // Reload with roles
    const updatedPermission = await Permission.findByPk(id, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'nom'],
        through: { attributes: [] }
      }]
    });

    sendSuccess(res, updatedPermission, 'Permission updated successfully');

  } catch (error) {
    console.error('Update permission error:', error);
    sendError(res, 'Failed to update permission', 500, error.message);
  }
});

// DELETE /api/admin/permissions/:id - Delete permission
router.delete('/:id', idValidation, async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return sendError(res, 'Permission not found', 404);
    }

    // Check if permission is assigned to any roles
    const roleCount = await permission.countRoles();
    if (roleCount > 0) {
      return sendError(res, 
        `Cannot delete permission. It is assigned to ${roleCount} role(s).`, 
        400
      );
    }

    await permission.destroy();

    sendSuccess(res, null, 'Permission deleted successfully');

  } catch (error) {
    console.error('Delete permission error:', error);
    sendError(res, 'Failed to delete permission', 500, error.message);
  }
});

// GET /api/admin/permissions/grouped - Get permissions grouped by module
router.get('/grouped/by-module', async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'module', 'action', 'description'],
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'nom'],
        through: { attributes: [] }
      }],
      order: [['module', 'ASC'], ['action', 'ASC']]
    });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const module = permission.module || 'Other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});

    sendSuccess(res, groupedPermissions);

  } catch (error) {
    console.error('Get grouped permissions error:', error);
    sendError(res, 'Failed to retrieve grouped permissions', 500, error.message);
  }
});

// POST /api/admin/permissions/seed - Seed default permissions
router.post('/seed', async (req, res) => {
  try {
    const defaultPermissions = [
      // User permissions
      { module: 'utilisateurs', action: 'create', description: 'Créer des utilisateurs' },
      { module: 'utilisateurs', action: 'read', description: 'Voir les utilisateurs' },
      { module: 'utilisateurs', action: 'update', description: 'Modifier les utilisateurs' },
      { module: 'utilisateurs', action: 'delete', description: 'Supprimer des utilisateurs' },
      
      // Client permissions
      { module: 'clients', action: 'create', description: 'Créer des clients' },
      { module: 'clients', action: 'read', description: 'Voir les clients' },
      { module: 'clients', action: 'update', description: 'Modifier les clients' },
      { module: 'clients', action: 'delete', description: 'Supprimer des clients' },
      
      // Equipment permissions
      { module: 'equipements', action: 'create', description: 'Créer des équipements' },
      { module: 'equipements', action: 'read', description: 'Voir les équipements' },
      { module: 'equipements', action: 'update', description: 'Modifier les équipements' },
      { module: 'equipements', action: 'delete', description: 'Supprimer des équipements' },
      
      // Intervention permissions
      { module: 'interventions', action: 'create', description: 'Créer des interventions' },
      { module: 'interventions', action: 'read', description: 'Voir les interventions' },
      { module: 'interventions', action: 'update', description: 'Modifier les interventions' },
      { module: 'interventions', action: 'delete', description: 'Supprimer des interventions' },
      { module: 'interventions', action: 'validate', description: 'Valider les interventions' },
      
      // Report permissions
      { module: 'rapports', action: 'create', description: 'Créer des rapports' },
      { module: 'rapports', action: 'read', description: 'Voir les rapports' },
      { module: 'rapports', action: 'validate', description: 'Valider les rapports' },
      
      // Analytics permissions
      { module: 'analytics', action: 'read', description: 'Voir les analyses' },
      
      // Admin permissions
      { module: 'admin', action: 'manage_users', description: 'Gérer les utilisateurs' },
      { module: 'admin', action: 'manage_roles', description: 'Gérer les rôles' },
      { module: 'admin', action: 'manage_permissions', description: 'Gérer les permissions' }
    ];

    const createdPermissions = [];
    
    for (const permData of defaultPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { module: permData.module, action: permData.action },
        defaults: permData
      });
      
      if (created) {
        createdPermissions.push(permission);
      }
    }

    sendSuccess(res, {
      created: createdPermissions.length,
      total: defaultPermissions.length,
      permissions: createdPermissions
    }, `Seeded ${createdPermissions.length} new permissions`);

  } catch (error) {
    console.error('Seed permissions error:', error);
    sendError(res, 'Failed to seed permissions', 500, error.message);
  }
});

module.exports = router;