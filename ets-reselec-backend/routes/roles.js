const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body, param } = require('express-validator');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getAllPermissions
} = require('../controllers/roleController');

// Role validations
const roleValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Permission IDs must be positive integers')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Role name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID')
  ],

  assignPermissions: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('permissions')
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .isInt({ min: 1 })
      .withMessage('Permission IDs must be positive integers')
  ]
};

// All routes require authentication
router.use(verifyToken);

// GET /api/roles - List all roles (accessible to all authenticated users)
router.get('/', getAllRoles);

// GET /api/permissions - List all permissions (accessible to all authenticated users)
router.get('/permissions', getAllPermissions);

// GET /api/roles/:id - Get role details (accessible to all authenticated users)
router.get('/:id', 
  roleValidations.getById,
  getRoleById
);

// Admin-only routes
router.use(checkRole('Administrateur', 'Admin'));

// POST /api/roles - Create new role
router.post('/',
  roleValidations.create,
  createRole
);

// PUT /api/roles/:id - Update role
router.put('/:id',
  roleValidations.update,
  updateRole
);

// DELETE /api/roles/:id - Delete role
router.delete('/:id',
  roleValidations.delete,
  deleteRole
);

// POST /api/roles/:id/permissions - Assign permissions to role
router.post('/:id/permissions',
  roleValidations.assignPermissions,
  assignPermissions
);

module.exports = router;