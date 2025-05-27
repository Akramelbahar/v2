const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { interventionValidations, queryValidations, idValidation } = require('../middleware/validation');
const {
  getAllInterventions,
  getInterventionById,
  createIntervention,
  createOrUpdateDiagnostic,
  updatePlanification,
  addControleQualite,
  updateInterventionStatus,
  getWorkflowStatus,
  getStatusCounts
} = require('../controllers/interventionController');

// All routes require authentication
router.use(verifyToken);

// GET /api/interventions - List interventions with filters
router.get('/', 
  [...queryValidations.pagination, ...queryValidations.dateRange],
  getAllInterventions
);

// GET /api/interventions/status-counts - Get intervention counts by status
router.get('/status-counts', getStatusCounts);

// GET /api/interventions/:id - Get intervention details
router.get('/:id', 
  idValidation,
  getInterventionById
);

// POST /api/interventions - Create new intervention
router.post('/',
  interventionValidations.create,
  createIntervention
);

// GET /api/interventions/:id/workflow - Get complete workflow status
router.get('/:id/workflow',
  idValidation,
  getWorkflowStatus
);

// POST /api/interventions/:id/diagnostic - Create/update diagnostic phase
router.post('/:id/diagnostic',
  interventionValidations.diagnostic,
  createOrUpdateDiagnostic
);

// PUT /api/interventions/:id/planification - Update planning phase
router.put('/:id/planification',
  interventionValidations.planification,
  updatePlanification
);

// POST /api/interventions/:id/controle-qualite - Add quality control results
router.post('/:id/controle-qualite',
  interventionValidations.controleQualite,
  addControleQualite
);

// PUT /api/interventions/:id/status - Update intervention status
router.put('/:id/status',
  interventionValidations.updateStatus,
  updateInterventionStatus
);

module.exports = router;