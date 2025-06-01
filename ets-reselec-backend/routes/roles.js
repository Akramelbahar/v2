// ets-reselec-backend/routes/roles.js
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
  getAllPermissions,
  updateRolePermissions,
  getUsersByRole
} = require('../controllers/roleController');

// Role validations
const roleValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Role name must be between 3 and 100 characters')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Role name cannot be empty')
      .isLength({ min: 3, max: 100 })
      .withMessage('Role name must be between 3 and 100 characters')
  ],

  updatePermissions: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('permission_ids')
      .isArray()
      .withMessage('Permission IDs must be an array'),
    
    body('permission_ids.*')
      .isInt({ min: 1 })
      .withMessage('Each permission ID must be a positive integer')
  ]
};

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Admin', 'Administrateur'));

// GET /api/roles/permissions - List all permissions (moved up to avoid conflict with /:id)
router.get('/permissions', getAllPermissions);

// GET /api/roles - List all roles
router.get('/', getAllRoles);

// GET /api/roles/:id - Get role details
router.get('/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  getRoleById
);

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
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  deleteRole
);

// PUT /api/roles/:id/permissions - Update role permissions
router.put('/:id/permissions',
  roleValidations.updatePermissions,
  updateRolePermissions
);

// GET /api/roles/:id/users - Get users with specific role
router.get('/:id/users',
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  getUsersByRole
);

module.exports = router;