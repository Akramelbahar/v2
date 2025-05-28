const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, checkPermission } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Import controllers
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats
} = require('../controllers/userController');

const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
} = require('../controllers/roleController');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Admin', 'Administrateur'));

// Validation schemas
const userValidation = {
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
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
    body('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer'),
    
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ]
};

const roleValidation = {
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
      .withMessage('Each permission must be a valid ID')
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
      .withMessage('Each permission must be a valid ID')
  ]
};

const permissionValidation = {
  create: [
    body('module')
      .notEmpty()
      .withMessage('Module is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Module must be between 2 and 100 characters'),
    
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Action must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Description cannot exceed 255 characters')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid permission ID'),
    
    body('module')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Module must be between 2 and 100 characters'),
    
    body('action')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Action must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Description cannot exceed 255 characters')
  ]
};

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort field must contain only letters'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

// USER MANAGEMENT ROUTES

// GET /api/admin/users - Get all users with pagination and filters
router.get('/users', 
  paginationValidation,
  getAllUsers
);

// GET /api/admin/users/stats - Get user statistics
router.get('/users/stats', getUserStats);

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  getUserById
);

// POST /api/admin/users - Create new user
router.post('/users', 
  userValidation.create,
  createUser
);

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', 
  userValidation.update,
  updateUser
);

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status',
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),
  updateUserStatus
);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  deleteUser
);

// ROLE MANAGEMENT ROUTES

// GET /api/admin/roles - Get all roles with pagination
router.get('/roles', 
  paginationValidation,
  getAllRoles
);

// GET /api/admin/roles/:id - Get role by ID
router.get('/roles/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  getRoleById
);

// POST /api/admin/roles - Create new role
router.post('/roles', 
  roleValidation.create,
  createRole
);

// PUT /api/admin/roles/:id - Update role
router.put('/roles/:id', 
  roleValidation.update,
  updateRole
);

// DELETE /api/admin/roles/:id - Delete role
router.delete('/roles/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid role ID'),
  deleteRole
);

// PERMISSION MANAGEMENT ROUTES

// GET /api/admin/permissions - Get all permissions
router.get('/permissions', 
  query('groupBy')
    .optional()
    .isIn(['module', 'none'])
    .withMessage('GroupBy must be module or none'),
  getAllPermissions
);

// POST /api/admin/permissions - Create new permission
router.post('/permissions', 
  permissionValidation.create,
  createPermission
);

// PUT /api/admin/permissions/:id - Update permission
router.put('/permissions/:id', 
  permissionValidation.update,
  updatePermission
);

// DELETE /api/admin/permissions/:id - Delete permission
router.delete('/permissions/:id', 
  param('id').isInt({ min: 1 }).withMessage('Invalid permission ID'),
  deletePermission
);

module.exports = router;