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
  getRolePermissions,
  updateRolePermissions
} = require('../controllers/roleController');

// All routes require authentication
router.use(verifyToken);

// Validation rules
const roleValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
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
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters'),
    
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Permission IDs must be positive integers')
  ]
};

// GET /api/roles - List roles
router.get('/', getAllRoles);

// GET /api/roles/:id - Get role details
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  getRoleById
);

// POST /api/roles - Create new role (Admin only)
router.post('/',
  checkRole('Administrateur'),
  roleValidations.create,
  createRole
);

// PUT /api/roles/:id - Update role (Admin only)
router.put('/:id',
  checkRole('Administrateur'),
  roleValidations.update,
  updateRole
);

// DELETE /api/roles/:id - Delete role (Admin only)
router.delete('/:id',
  checkRole('Administrateur'),
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  deleteRole
);

// GET /api/roles/:id/permissions - Get role permissions
router.get('/:id/permissions',
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  getRolePermissions
);

// PUT /api/roles/:id/permissions - Update role permissions (Admin only)
router.put('/:id/permissions',
  checkRole('Administrateur'),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
    body('permissions')
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .isInt({ min: 1 })
      .withMessage('Permission IDs must be positive integers')
  ],
  updateRolePermissions
);

module.exports = router;
