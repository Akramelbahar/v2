
// ets-reselec-backend/routes/roles.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  getAllRoles,
  createRole,
  updateRole,
  getAllPermissions,
  assignUserRole
} = require('../controllers/roleController');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// Role validation rules
const roleValidation = [
  body('nom')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Role name must be between 2 and 100 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
];

// Routes
router.get('/', getAllRoles);
router.post('/', roleValidation, createRole);
router.put('/:id', roleValidation, updateRole);

// Permissions routes
router.get('/permissions', getAllPermissions);

// User role assignment
router.post('/users/:id/assign-role', [
  body('role_id').isInt().withMessage('Valid role ID required'),
  body('approval_reason').optional().isString()
], assignUserRole);

module.exports = router;
