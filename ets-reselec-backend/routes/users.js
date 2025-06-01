// ets-reselec-backend/routes/users.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  toggleUserStatus,
  getUserPermissions
} = require('../controllers/userController');

// User validations
const userValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number'),
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
    body('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID'),
    
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
    body('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer')
  ],

  updateRole: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID'),
    
    body('role_id')
      .notEmpty()
      .withMessage('Role ID is required')
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer')
  ],

  toggleStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID'),
    
    body('enabled')
      .notEmpty()
      .withMessage('Enabled status is required')
      .isBoolean()
      .withMessage('Enabled must be true or false')
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer'),
    
    query('enabled')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Enabled must be true or false')
  ]
};

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Admin', 'Administrateur'));

// GET /api/users - List all users
router.get('/', 
  userValidations.list,
  getAllUsers
);

// GET /api/users/:id - Get user details
router.get('/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  getUserById
);

// POST /api/users - Create new user
router.post('/',
  userValidations.create,
  createUser
);

// PUT /api/users/:id - Update user
router.put('/:id',
  userValidations.update,
  updateUser
);

// DELETE /api/users/:id - Delete user
router.delete('/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  deleteUser
);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role',
  userValidations.updateRole,
  updateUserRole
);

// POST /api/users/:id/reset-password - Reset user password
router.post('/:id/reset-password',
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  resetUserPassword
);

// PUT /api/users/:id/status - Enable/disable user
router.put('/:id/status',
  userValidations.toggleStatus,
  toggleUserStatus
);

// GET /api/users/:id/permissions - Get user permissions
router.get('/:id/permissions',
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  getUserPermissions
);

module.exports = router;