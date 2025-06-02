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
  resetUserPassword,
  toggleUserStatus
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
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
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
      .withMessage('Role ID must be a positive integer'),
    
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean value')
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
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .optional()
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
      .withMessage('Role ID must be a positive integer'),
    
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean value')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID')
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
    
    query('sortBy')
      .optional()
      .isIn(['id', 'nom', 'username', 'createdAt'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
    
    query('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer'),
    
    query('active')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Active must be true or false')
  ]
};

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// GET /api/users - List all users
router.get('/', 
  userValidations.list,
  getAllUsers
);

// GET /api/users/:id - Get user details
router.get('/:id', 
  userValidations.getById,
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
  userValidations.delete,
  deleteUser
);

// POST /api/users/:id/reset-password - Reset user password
router.post('/:id/reset-password',
  userValidations.getById,
  resetUserPassword
);

// PUT /api/users/:id/toggle-status - Toggle user active status
router.put('/:id/toggle-status',
  userValidations.getById,
  toggleUserStatus
);

module.exports = router;