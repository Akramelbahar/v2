const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { query } = require('express-validator');
const {
  getDashboardStats,
  getRecentInterventions,
  getDashboardAlerts,
  getChartsData,
  getPerformanceMetrics
} = require('../controllers/dashboardController');

// All routes require authentication
router.use(verifyToken);

// Query validations for dashboard
const dashboardValidations = [
  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Timeframe must be between 1 and 365 days'),
  
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// GET /api/dashboard/stats - Get main dashboard statistics
router.get('/stats', 
  dashboardValidations,
  getDashboardStats
);

// GET /api/dashboard/recent-interventions - Get recent interventions
router.get('/recent-interventions',
  dashboardValidations,
  getRecentInterventions
);

// GET /api/dashboard/alerts - Get urgent and overdue items
router.get('/alerts', getDashboardAlerts);

// GET /api/dashboard/charts - Get data for charts and visualizations
router.get('/charts',
  dashboardValidations,
  getChartsData
);

// GET /api/dashboard/performance - Get performance metrics
router.get('/performance',
  dashboardValidations,
  getPerformanceMetrics
);

module.exports = router;