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
  getSectionTypes
} = require('../controllers/sectionController');

// All routes require authentication
router.use(verifyToken);

// Validation rules
const sectionValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Section name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Section name must be between 2 and 100 characters'),
    
    body('type')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Type cannot exceed 100 characters'),
    
    body('responsable_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Responsible user ID must be a positive integer')
  ],
  
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid section ID'),
    
    body('nom')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Section name must be between 2 and 100 characters'),
    
    body('type')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Type cannot exceed 100 characters'),
    
    body('responsable_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Responsible user ID must be a positive integer')
  ]
};

// GET /api/sections - List sections
router.get('/', getAllSections);

// GET /api/sections/types - Get section types
router.get('/types', getSectionTypes);

// GET /api/sections/:id - Get section details
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid section ID'),
  getSectionById
);

// POST /api/sections - Create new section (Admin only)
router.post('/',
  checkRole('Administrateur'),
  sectionValidations.create,
  createSection
);

// PUT /api/sections/:id - Update section (Admin only)
router.put('/:id',
  checkRole('Administrateur'),
  sectionValidations.update,
  updateSection
);

// DELETE /api/sections/:id - Delete section (Admin only)
router.delete('/:id',
  checkRole('Administrateur'),
  param('id').isInt({ min: 1 }).withMessage('Invalid section ID'),
  deleteSection
);

module.exports = router;