const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionTypes
} = require('../controllers/sectionController');

// Section validations
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
      .withMessage('Responsable ID must be a positive integer')
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
    
    body('type')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Type cannot exceed 100 characters'),
    
    body('responsable_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Responsable ID must be a positive integer')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid section ID')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid section ID')
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
      .isIn(['id', 'nom', 'type'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC')
  ]
};

// All routes require authentication
router.use(verifyToken);

// GET /api/sections - List all sections (accessible to all authenticated users)
router.get('/', 
  sectionValidations.list,
  getAllSections
);

// GET /api/sections/types - Get section types (accessible to all authenticated users)
router.get('/types', getSectionTypes);

// GET /api/sections/:id - Get section details (accessible to all authenticated users)
router.get('/:id', 
  sectionValidations.getById,
  getSectionById
);

// Admin-only routes
router.use(checkRole('Administrateur', 'Admin'));

// POST /api/sections - Create new section
router.post('/',
  sectionValidations.create,
  createSection
);

// PUT /api/sections/:id - Update section
router.put('/:id',
  sectionValidations.update,
  updateSection
);

// DELETE /api/sections/:id - Delete section
router.delete('/:id',
  sectionValidations.delete,
  deleteSection
);

module.exports = router;