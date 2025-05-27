const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { equipmentValidations, queryValidations, idValidation } = require('../middleware/validation');
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentTypes
} = require('../controllers/equipmentController');

// All routes require authentication
router.use(verifyToken);

// GET /api/equipment - List equipment with filters
router.get('/', 
  queryValidations.pagination,
  getAllEquipment
);

// GET /api/equipment/types - Get available equipment types
router.get('/types', getEquipmentTypes);

// GET /api/equipment/:id - Get equipment details
router.get('/:id', 
  idValidation,
  getEquipmentById
);

// POST /api/equipment - Create new equipment
router.post('/',
  equipmentValidations.create,
  createEquipment
);

// PUT /api/equipment/:id - Update equipment
router.put('/:id',
  equipmentValidations.update,
  updateEquipment
);

// DELETE /api/equipment/:id - Delete equipment
router.delete('/:id',
  equipmentValidations.delete,
  checkRole('Admin'), // Only admins can delete equipment
  deleteEquipment
);

module.exports = router;