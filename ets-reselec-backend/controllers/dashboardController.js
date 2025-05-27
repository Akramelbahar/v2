const { Op } = require('sequelize');
const { 
  Intervention, 
  Equipment, 
  Client, 
  User,
  sequelize 
} = require('../models');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // Default to last 30 days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

    // Get basic counts
    const [
      totalInterventions,
      totalEquipment,
      totalClients,
      activeInterventions,
      completedInterventions,
      urgentInterventions,
      overdueInterventions
    ] = await Promise.all([
      // Total interventions
      Intervention.count(),
      
      // Total equipment
      Equipment.count(),
      
      // Total clients
      Client.count(),
      
      // Active interventions (in progress statuses)
      Intervention.count({
        where: {
          statut: {
            [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE']
          }
        }
      }),
      
      // Completed interventions
      Intervention.count({
        where: { statut: 'TERMINEE' }
      }),
      
      // Urgent interventions (active and urgent)
      Intervention.count({
        where: {
          urgence: true,
          statut: {
            [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE']
          }
        }
      }),
      
      // Overdue interventions (older than 30 days and still active)
      Intervention.count({
        where: {
          date: { [Op.lt]: daysAgo },
          statut: {
            [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE']
          }
        }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalInterventions > 0 
      ? ((completedInterventions / totalInterventions) * 100).toFixed(1)
      : 0;

    // Get equipment by type breakdown
    const equipmentByType = await Equipment.findAll({
      attributes: [
        'type_equipement',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type_equipement'],
      raw: true
    });

    const stats = {
      overview: {
        totalInterventions,
        totalEquipment,
        totalClients,
        activeInterventions,
        completedInterventions,
        completionRate: parseFloat(completionRate)
      },
      alerts: {
        urgentInterventions,
        overdueInterventions
      },
      equipmentBreakdown: equipmentByType.reduce((acc, item) => {
        acc[item.type_equipement || 'Unknown'] = parseInt(item.count);
        return acc;
      }, {})
    };

    sendSuccess(res, stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    sendError(res, 'Failed to retrieve dashboard statistics', 500, error.message);
  }
};

// GET /api/dashboard/recent-interventions
const getRecentInterventions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentInterventions = await Intervention.findAll({
      include: [
        {
          model: Equipment,
          as: 'equipement',
          attributes: ['id', 'nom', 'marque', 'modele', 'type_equipement'],
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['id', 'nom_entreprise']
          }]
        },
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit)
    });

    // Add calculated fields
    const interventionsWithDetails = recentInterventions.map(intervention => ({
      ...intervention.toJSON(),
      daysAgo: Math.floor((new Date() - new Date(intervention.date)) / (1000 * 60 * 60 * 24)),
      statusColor: intervention.getStatusColor()
    }));

    sendSuccess(res, interventionsWithDetails);

  } catch (error) {
    console.error('Get recent interventions error:', error);
    sendError(res, 'Failed to retrieve recent interventions', 500, error.message);
  }
};

// GET /api/dashboard/alerts
const getDashboardAlerts = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get urgent interventions
    const urgentInterventions = await Intervention.findAll({
      where: {
        urgence: true,
        statut: {
          [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE']
        }
      },
      include: [
        {
          model: Equipment,
          as: 'equipement',
          attributes: ['nom', 'type_equipement'],
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['nom_entreprise']
          }]
        }
      ],
      order: [['date', 'ASC']],
      limit: 5
    });

    // Get overdue interventions
    const overdueInterventions = await Intervention.findAll({
      where: {
        date: { [Op.lt]: thirtyDaysAgo },
        statut: {
          [Op.in]: ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE']
        }
      },
      include: [
        {
          model: Equipment,
          as: 'equipement',
          attributes: ['nom', 'type_equipement'],
          include: [{
            model: Client,
            as: 'proprietaire',
            attributes: ['nom_entreprise']
          }]
        }
      ],
      order: [['date', 'ASC']],
      limit: 5
    });

    // Get equipment needing attention (multiple active interventions)
    const equipmentNeedingAttention = await Equipment.findAll({
      attributes: [
        'id', 'nom', 'type_equipement',
        [sequelize.literal(`(
          SELECT COUNT(*)
          FROM Intervention
          WHERE Intervention.equipement_id = Equipment.id
          AND Intervention.statut IN ('PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE')
        )`), 'activeInterventionCount']
      ],
      include: [{
        model: Client,
        as: 'proprietaire',
        attributes: ['nom_entreprise']
      }],
      having: sequelize.literal('activeInterventionCount > 1'),
      limit: 5
    });

    const alerts = {
      urgent: urgentInterventions.map(intervention => ({
        id: intervention.id,
        type: 'urgent',
        title: `Urgent: ${intervention.equipement.nom}`,
        description: `${intervention.equipement.proprietaire.nom_entreprise} - ${intervention.description}`,
        date: intervention.date,
        severity: 'high'
      })),
      overdue: overdueInterventions.map(intervention => {
        const daysOverdue = Math.floor((new Date() - new Date(intervention.date)) / (1000 * 60 * 60 * 24));
        return {
          id: intervention.id,
          type: 'overdue',
          title: `Overdue: ${intervention.equipement.nom}`,
          description: `${daysOverdue} days overdue - ${intervention.equipement.proprietaire.nom_entreprise}`,
          date: intervention.date,
          severity: daysOverdue > 60 ? 'critical' : 'medium'
        };
      }),
      equipmentAttention: equipmentNeedingAttention.map(equipment => ({
        id: equipment.id,
        type: 'equipment_attention',
        title: `Multiple Issues: ${equipment.nom}`,
        description: `${equipment.activeInterventionCount} active interventions - ${equipment.proprietaire.nom_entreprise}`,
        severity: 'medium'
      }))
    };

    // Calculate total alert count
    const totalAlerts = alerts.urgent.length + alerts.overdue.length + alerts.equipmentAttention.length;

    sendSuccess(res, { ...alerts, totalAlerts });

  } catch (error) {
    console.error('Get dashboard alerts error:', error);
    sendError(res, 'Failed to retrieve dashboard alerts', 500, error.message);
  }
};

// GET /api/dashboard/charts
const getChartsData = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, quarter, year

    // Interventions by status
    const interventionsByStatus = await Intervention.findAll({
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut'],
      raw: true
    });

    // Equipment by type
    const equipmentByType = await Equipment.findAll({
      attributes: [
        'type_equipement',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type_equipement'],
      raw: true
    });

    // Monthly trends for the last 12 months
    const monthlyTrends = await sequelize.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'TERMINEE' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN urgence = true THEN 1 ELSE 0 END) as urgent
      FROM Intervention 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Client activity (interventions per client)
    const clientActivity = await sequelize.query(`
      SELECT 
        c.nom_entreprise,
        COUNT(i.id) as intervention_count,
        SUM(CASE WHEN i.statut = 'TERMINEE' THEN 1 ELSE 0 END) as completed_count
      FROM Client c
      LEFT JOIN Equipement e ON c.id = e.proprietaire_id
      LEFT JOIN Intervention i ON e.id = i.equipement_id
      WHERE i.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY c.id, c.nom_entreprise
      HAVING intervention_count > 0
      ORDER BY intervention_count DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // Equipment reliability (failure rate)
    const equipmentReliability = await sequelize.query(`
      SELECT 
        e.type_equipement,
        COUNT(i.id) as total_interventions,
        SUM(CASE WHEN i.statut = 'ECHEC' THEN 1 ELSE 0 END) as failed_interventions,
        ROUND((SUM(CASE WHEN i.statut = 'ECHEC' THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2) as failure_rate
      FROM Equipement e
      LEFT JOIN Intervention i ON e.id = i.equipement_id
      WHERE i.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY e.type_equipement
      HAVING total_interventions >= 5
      ORDER BY failure_rate DESC
    `, { type: sequelize.QueryTypes.SELECT });

    const chartsData = {
      interventionsByStatus: interventionsByStatus.map(item => ({
        status: item.statut,
        count: parseInt(item.count),
        percentage: 0 // Will be calculated on frontend
      })),
      equipmentByType: equipmentByType.map(item => ({
        type: item.type_equipement || 'Unknown',
        count: parseInt(item.count)
      })),
      monthlyTrends: monthlyTrends.map(item => ({
        month: item.month,
        total: parseInt(item.total),
        completed: parseInt(item.completed),
        urgent: parseInt(item.urgent),
        completionRate: item.total > 0 ? ((item.completed / item.total) * 100).toFixed(1) : 0
      })),
      clientActivity: clientActivity.map(item => ({
        client: item.nom_entreprise,
        interventions: parseInt(item.intervention_count),
        completed: parseInt(item.completed_count),
        completionRate: item.intervention_count > 0 ? 
          ((item.completed_count / item.intervention_count) * 100).toFixed(1) : 0
      })),
      equipmentReliability: equipmentReliability.map(item => ({
        type: item.type_equipement,
        totalInterventions: parseInt(item.total_interventions),
        failedInterventions: parseInt(item.failed_interventions),
        failureRate: parseFloat(item.failure_rate) || 0
      }))
    };

    sendSuccess(res, chartsData);

  } catch (error) {
    console.error('Get charts data error:', error);
    sendError(res, 'Failed to retrieve charts data', 500, error.message);
  }
};

// GET /api/dashboard/performance
const getPerformanceMetrics = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

    // Average completion time
    const completionMetrics = await sequelize.query(`
      SELECT 
        AVG(DATEDIFF(
          CASE WHEN statut = 'TERMINEE' THEN CURDATE() ELSE NULL END,
          date
        )) as avg_completion_days,
        COUNT(CASE WHEN statut = 'TERMINEE' THEN 1 END) as completed_count,
        COUNT(*) as total_count
      FROM Intervention 
      WHERE date >= ?
    `, {
      replacements: [daysAgo.toISOString().split('T')[0]],
      type: sequelize.QueryTypes.SELECT
    });

    // Response time by urgency
    const responseMetrics = await sequelize.query(`
      SELECT 
        urgence,
        AVG(DATEDIFF(
          CASE WHEN statut IN ('EN_COURS', 'TERMINEE') THEN CURDATE() ELSE NULL END,
          date
        )) as avg_response_days
      FROM Intervention 
      WHERE date >= ?
      AND statut IN ('EN_COURS', 'TERMINEE')
      GROUP BY urgence
    `, {
      replacements: [daysAgo.toISOString().split('T')[0]],
      type: sequelize.QueryTypes.SELECT
    });

    // Workload by user
    const workloadMetrics = await sequelize.query(`
      SELECT 
        u.nom,
        COUNT(i.id) as active_interventions,
        COUNT(CASE WHEN i.urgence = true THEN 1 END) as urgent_interventions
      FROM Utilisateur u
      LEFT JOIN Intervention i ON u.id = i.creerPar_id
      WHERE i.statut IN ('PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE')
      GROUP BY u.id, u.nom
      HAVING active_interventions > 0
      ORDER BY active_interventions DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    const metrics = {
      completion: {
        averageDays: parseFloat(completionMetrics[0]?.avg_completion_days) || 0,
        completionRate: completionMetrics[0]?.total_count > 0 
          ? ((completionMetrics[0].completed_count / completionMetrics[0].total_count) * 100).toFixed(1)
          : 0,
        totalProcessed: parseInt(completionMetrics[0]?.total_count) || 0
      },
      response: {
        urgent: parseFloat(responseMetrics.find(r => r.urgence)?.avg_response_days) || 0,
        normal: parseFloat(responseMetrics.find(r => !r.urgence)?.avg_response_days) || 0
      },
      workload: workloadMetrics.map(item => ({
        user: item.nom,
        activeInterventions: parseInt(item.active_interventions),
        urgentInterventions: parseInt(item.urgent_interventions)
      }))
    };

    sendSuccess(res, metrics);

  } catch (error) {
    console.error('Get performance metrics error:', error);
    sendError(res, 'Failed to retrieve performance metrics', 500, error.message);
  }
};

module.exports = {
  getDashboardStats,
  getRecentInterventions,
  getDashboardAlerts,
  getChartsData,
  getPerformanceMetrics
};