const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body, param } = require('express-validator');
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getAvailableUsers,
  assignUsersToSection
} = require('../controllers/sectionController');

// All routes require authentication
router.use(verifyToken);

// Validation middleware
const sectionValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Section name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Section name must be between 2 and 100 characters'),
    body('responsable_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('Invalid responsible user ID')
  ],
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid section ID'),
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Section name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Section name must be between 2 and 100 characters'),
    body('responsable_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('Invalid responsible user ID')
  ],
  assignUsers: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid section ID'),
    body('userIds')
      .isArray()
      .withMessage('User IDs must be an array'),
    body('userIds.*')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID')
  ]
};

// Routes
router.get('/', getAllSections);
router.get('/users', checkRole('Administrateur'), getAvailableUsers);
router.get('/:id', getSectionById);
router.post('/', checkRole('Administrateur'), sectionValidations.create, createSection);
router.put('/:id', checkRole('Administrateur'), sectionValidations.update, updateSection);
router.delete('/:id', checkRole('Administrateur'), param('id').isInt({ min: 1 }), deleteSection);
router.post('/:id/assign-users', checkRole('Administrateur'), sectionValidations.assignUsers, assignUsersToSection);

module.exports = router;