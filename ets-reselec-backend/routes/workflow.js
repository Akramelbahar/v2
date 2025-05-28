// ets-reselec-backend/routes/workflow.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
  getInterventionWorkflow,
  transitionInterventionStatus,
  createOrUpdateDiagnostic,
  updatePlanification,
  addControleQualite,
  getWorkflowDashboard,
  WORKFLOW_STATUSES
} = require('../controllers/workflowController');

// All routes require authentication
router.use(verifyToken);

// Validation schemas
const workflowValidations = {
  transitionStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('statut')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(Object.values(WORKFLOW_STATUSES))
      .withMessage('Invalid workflow status'),
    
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],

  diagnostic: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('travailRequis')
      .optional()
      .isArray()
      .withMessage('Work required must be an array'),
    
    body('travailRequis.*.description')
      .notEmpty()
      .withMessage('Work description is required')
      .isLength({ min: 5, max: 500 })
      .withMessage('Work description must be between 5 and 500 characters'),
    
    body('travailRequis.*.priorite')
      .optional()
      .isIn(['HAUTE', 'NORMALE', 'BASSE'])
      .withMessage('Priority must be HAUTE, NORMALE, or BASSE'),
    
    body('travailRequis.*.duree_estimee')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive integer'),
    
    body('besoinPDR')
      .optional()
      .isArray()
      .withMessage('Spare parts needs must be an array'),
    
    body('besoinPDR.*.piece')
      .notEmpty()
      .withMessage('Spare part name is required'),
    
    body('besoinPDR.*.quantite')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('observationsGenerales')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('General observations cannot exceed 2000 characters'),
    
    body('tempsEstime')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated time must be a positive integer')
  ],

  planification: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('capaciteExecution')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Execution capacity must be between 0 and 100'),
    
    body('urgencePrise')
      .optional()
      .isBoolean()
      .withMessage('Urgency handled must be true or false'),
    
    body('disponibilitePDR')
      .optional()
      .isBoolean()
      .withMessage('Spare parts availability must be true or false'),
    
    body('datePrevisionnelle')
      .optional()
      .isISO8601()
      .withMessage('Expected date must be in ISO format')
      .toDate(),
    
    body('dureeEstimee')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be a positive integer'),
    
    body('ressourcesNecessaires')
      .optional()
      .isArray()
      .withMessage('Required resources must be an array'),
    
    body('contraintesSpeciales')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Special constraints cannot exceed 1000 characters')
  ],

  controleQualite: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('resultatsEssais')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Test results cannot exceed 2000 characters'),
    
    body('analyseVibratoire')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Vibratory analysis cannot exceed 2000 characters'),
    
    body('conformiteNormes')
      .optional()
      .isBoolean()
      .withMessage('Standards compliance must be true or false'),
    
    body('validationTechnique')
      .optional()
      .isBoolean()
      .withMessage('Technical validation must be true or false'),
    
    body('observationsQualite')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Quality observations cannot exceed 1000 characters'),
    
    body('testsFonctionnels')
      .optional()
      .isArray()
      .withMessage('Functional tests must be an array'),
    
    body('testsFonctionnels.*.nom_test')
      .notEmpty()
      .withMessage('Test name is required'),
    
    body('testsFonctionnels.*.conforme')
      .optional()
      .isBoolean()
      .withMessage('Test compliance must be true or false')
  ]
};

// Dashboard validation
const dashboardValidations = [
  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Timeframe must be between 1 and 365 days')
];

// GET /api/workflow/dashboard - Get workflow dashboard statistics
router.get('/dashboard', 
  dashboardValidations,
  getWorkflowDashboard
);

// GET /api/workflow/intervention/:id - Get complete workflow status for an intervention
router.get('/intervention/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid intervention ID'),
  getInterventionWorkflow
);

// POST /api/workflow/intervention/:id/transition - Transition intervention status
router.post('/intervention/:id/transition',
  workflowValidations.transitionStatus,
  transitionInterventionStatus
);

// POST /api/workflow/intervention/:id/diagnostic - Create or update diagnostic phase
router.post('/intervention/:id/diagnostic',
  workflowValidations.diagnostic,
  createOrUpdateDiagnostic
);

// PUT /api/workflow/intervention/:id/planification - Update planning phase
router.put('/intervention/:id/planification',
  workflowValidations.planification,
  updatePlanification
);

// POST /api/workflow/intervention/:id/controle-qualite - Add quality control results
router.post('/intervention/:id/controle-qualite',
  workflowValidations.controleQualite,
  addControleQualite
);

// GET /api/workflow/intervention/:id/timeline - Get workflow timeline (future feature)
router.get('/intervention/:id/timeline',
  param('id').isInt({ min: 1 }).withMessage('Invalid intervention ID'),
  (req, res) => {
    // Placeholder for timeline feature
    res.json({
      success: true,
      data: [],
      message: 'Timeline feature coming soon'
    });
  }
);

// GET /api/workflow/templates - Get workflow templates (future feature)
router.get('/templates',
  (req, res) => {
    // Placeholder for templates feature
    res.json({
      success: true,
      data: {
        diagnostic: {
          travailRequis: [
            { description: 'Inspection visuelle', priorite: 'HAUTE', duree_estimee: 30 },
            { description: 'Test de fonctionnement', priorite: 'HAUTE', duree_estimee: 60 }
          ],
          besoinPDR: [
            { piece: 'Huile de lubrification', quantite: 1 }
          ]
        },
        planification: {
          ressourcesNecessaires: [
            { type_ressource: 'TECHNICIEN', description: 'Technicien spécialisé', quantite: 1 },
            { type_ressource: 'OUTIL', description: 'Multimètre', quantite: 1 }
          ]
        },
        controleQualite: {
          testsFonctionnels: [
            { nom_test: 'Test de vibration', valeur_attendue: '< 2mm/s' },
            { nom_test: 'Test électrique', valeur_attendue: 'Normal' }
          ]
        }
      },
      message: 'Workflow templates'
    });
  }
);

// GET /api/workflow/statistics - Get workflow statistics (future feature)
router.get('/statistics',
  dashboardValidations,
  (req, res) => {
    // Placeholder for detailed statistics
    res.json({
      success: true,
      data: {
        averageCompletionTime: {
          diagnostic: 2.5, // hours
          planification: 1.2,
          execution: 8.5,
          controleQualite: 1.8
        },
        bottlenecks: [
          { phase: 'PLANIFICATION', reason: 'Spare parts availability', frequency: 35 },
          { phase: 'EXECUTION', reason: 'Resource conflicts', frequency: 22 }
        ],
        efficiency: {
          totalInterventions: 150,
          completedOnTime: 120,
          averageDelay: 1.2 // days
        }
      },
      message: 'Workflow statistics'
    });
  }
);

module.exports = router;