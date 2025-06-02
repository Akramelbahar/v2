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
  changeUserPassword
} = require('../controllers/userController');

// All routes require authentication
router.use(verifyToken);

// Validation rules
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
      .withMessage('Password must be at least 6 characters'),
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
    body('role_id')
      .notEmpty()
      .withMessage('Role is required')
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer'),
    
    body('section_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Section ID must be a positive integer')
  ],
  
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID'),
    
    body('nom')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('username')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer'),
    
    body('section_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Section ID must be a positive integer')
  ]
};

// GET /api/users - List users (Admin only)
router.get('/', 
  checkRole('Administrateur'),
  getAllUsers
);

// GET /api/users/:id - Get user details (Admin only)
router.get('/:id',
  checkRole('Administrateur'),
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  getUserById
);

// POST /api/users - Create new user (Admin only)
router.post('/',
  checkRole('Administrateur'),
  userValidations.create,
  createUser
);

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id',
  checkRole('Administrateur'),
  userValidations.update,
  updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id',
  checkRole('Administrateur'),
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  deleteUser
);

// PUT /api/users/:id/change-password - Change user password (Admin only)
router.put('/:id/change-password',
  checkRole('Administrateur'),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  changeUserPassword
);

module.exports = router;
