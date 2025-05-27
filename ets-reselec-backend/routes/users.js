
// ets-reselec-backend/routes/users.js  
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// User validation rules
const userValidation = [
  body('nom')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role_id')
    .optional()
    .isInt()
    .withMessage('Valid role ID required')
];

// Routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', userValidation, createUser);
router.put('/:id', userValidation, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;