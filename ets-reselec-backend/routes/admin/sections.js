// ets-reselec-backend/routes/admin/sections.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../middleware/auth');
const { sectionValidations, queryValidations, idValidation } = require('../../middleware/validation');
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionTypes,
  getSectionUsers,
  assignUserToSection,
  removeUserFromSection,
  setSectionManager,
  getSectionStats,
  getSectionInterventions
} = require('../../controllers/sectionController');

// All routes require authentication
router.use(verifyToken);

// GET /api/sections - List sections
router.get('/', 
  queryValidations.pagination,
  getAllSections
);

// GET /api/sections/types - Get section types
router.get('/types', getSectionTypes);

// GET /api/sections/:id - Get section details
router.get('/:id', 
  idValidation,
  getSectionById
);

// GET /api/sections/:id/stats - Get section statistics
router.get('/:id/stats',
  idValidation,
  getSectionStats
);

// GET /api/sections/:id/users - Get users in section
router.get('/:id/users',
  idValidation,
  getSectionUsers
);

// GET /api/sections/:id/interventions - Get section interventions
router.get('/:id/interventions',
  idValidation,
  getSectionInterventions
);

// POST /api/sections - Create new section (Admin only)
router.post('/',
  checkRole('Admin'),
  sectionValidations.create,
  createSection
);

// PUT /api/sections/:id - Update section (Admin only)
router.put('/:id',
  checkRole('Admin'),
  sectionValidations.update,
  updateSection
);

// PUT /api/sections/:id/users/:userId - Assign user to section (Admin only)
router.put('/:id/users/:userId',
  checkRole('Admin'),
  sectionValidations.assignUser,
  assignUserToSection
);

// PUT /api/sections/:id/manager - Set section manager (Admin only)
router.put('/:id/manager',
  checkRole('Admin'),
  sectionValidations.setManager,
  setSectionManager
);

// DELETE /api/sections/:id/users/:userId - Remove user from section (Admin only)
router.delete('/:id/users/:userId',
  checkRole('Admin'),
  sectionValidations.assignUser,
  removeUserFromSection
);

// DELETE /api/sections/:id - Delete section (Admin only)
router.delete('/:id',
  checkRole('Admin'),
  sectionValidations.delete,
  deleteSection
);

module.exports = router;