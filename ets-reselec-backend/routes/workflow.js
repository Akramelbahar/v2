const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { Intervention, Equipment, Client, User } = require('../models');

// All workflow routes require authentication
router.use(verifyToken);

// GET /api/workflow/interventions - Get interventions for workflow management
router.get('/interventions', async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    
    const whereClause = {};
    if (status) whereClause.statut = status;
    if (priority) whereClause.urgence = priority === 'true';

    const interventions = await Intervention.findAll({
      where: whereClause,
      include: [
        {
          model: Equipment,
          as: 'equipement',
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['nom_entreprise']
          }]
        },
        {
          model: User,
          as: 'creerPar',
          attributes: ['nom']
        }
      ],
      order: [['date', 'DESC']],
      limit: 50
    });

    sendSuccess(res, interventions, 'Workflow interventions retrieved successfully');
  } catch (error) {
    console.error('Get workflow interventions error:', error);
    sendError(res, 'Failed to retrieve workflow interventions', 500, error.message);
  }
});

// PUT /api/workflow/interventions/:id/assign - Assign intervention to user
router.put('/interventions/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedUserId } = req.body;

    if (!assignedUserId) {
      return sendError(res, 'Assigned user ID is required', 400);
    }

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    // Check if user exists
    const user = await User.findByPk(assignedUserId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update intervention assignment (you might need to add an assignedTo field to your model)
    // For now, we'll just update the status
    await intervention.update({
      statut: 'EN_COURS'
      // assignedTo_id: assignedUserId // Add this field to your model if needed
    });

    sendSuccess(res, intervention, 'Intervention assigned successfully');
  } catch (error) {
    console.error('Assign intervention error:', error);
    sendError(res, 'Failed to assign intervention', 500, error.message);
  }
});

// PUT /api/workflow/interventions/:id/status - Update intervention workflow status
router.put('/interventions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    const validStatuses = ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'ECHEC'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const intervention = await Intervention.findByPk(id);
    if (!intervention) {
      return sendError(res, 'Intervention not found', 404);
    }

    await intervention.update({ statut: status });

    sendSuccess(res, intervention, 'Intervention status updated successfully');
  } catch (error) {
    console.error('Update intervention status error:', error);
    sendError(res, 'Failed to update intervention status', 500, error.message);
  }
});

// GET /api/workflow/dashboard - Get workflow dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalInterventions,
      inProgress,
      pending,
      completed,
      urgent
    ] = await Promise.all([
      Intervention.count(),
      Intervention.count({ where: { statut: 'EN_COURS' } }),
      Intervention.count({ where: { statut: 'PLANIFIEE' } }),
      Intervention.count({ where: { statut: 'TERMINEE' } }),
      Intervention.count({ where: { urgence: true, statut: ['PLANIFIEE', 'EN_COURS'] } })
    ]);

    const dashboardData = {
      overview: {
        total: totalInterventions,
        inProgress,
        pending,
        completed,
        urgent
      },
      completionRate: totalInterventions > 0 ? ((completed / totalInterventions) * 100).toFixed(1) : 0
    };

    sendSuccess(res, dashboardData, 'Workflow dashboard data retrieved successfully');
  } catch (error) {
    console.error('Get workflow dashboard error:', error);
    sendError(res, 'Failed to retrieve workflow dashboard data', 500, error.message);
  }
});

module.exports = router;