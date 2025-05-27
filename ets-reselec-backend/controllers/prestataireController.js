
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { PrestataireExterne, User, Intervention, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');
const multer = require('multer');
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/contracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `contract-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/prestataires - List providers with performance ratings
const getAllPrestataires = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category,
      sortBy = 'id',
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (search) {
      whereClause.nom = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await PrestataireExterne.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom', 'username']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Intervention_PrestataireExterne ipe
              WHERE ipe.prestataire_id = PrestataireExterne.id
            )`),
            'interventionCount'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Intervention_PrestataireExterne ipe
              JOIN Intervention i ON ipe.intervention_id = i.id
              WHERE ipe.prestataire_id = PrestataireExterne.id
              AND i.statut = 'TERMINEE'
            )`),
            'completedInterventions'
          ]
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    // Calculate performance ratings
    const providersWithRatings = rows.map(provider => ({
      ...provider.toJSON(),
      performanceRating: provider.dataValues.interventionCount > 0 
        ? Math.round((provider.dataValues.completedInterventions / provider.dataValues.interventionCount) * 5)
        : 0
    }));

    sendPaginatedResponse(res, providersWithRatings, page, limit, count);
  } catch (error) {
    console.error('Get prestataires error:', error);
    sendError(res, 'Failed to retrieve providers', 500, error.message);
  }
};

// GET /api/prestataires/:id - Get provider details with history
const getPrestataireById = async (req, res) => {
  try {
    const { id } = req.params;

    const prestataire = await PrestataireExterne.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom', 'username']
        },
        {
          model: Intervention,
          as: 'interventions',
          attributes: ['id', 'date', 'description', 'statut'],
          include: [{
            model: Equipment,
            as: 'equipement',
            attributes: ['nom', 'type_equipement'],
            include: [{
              model: Client,
              as: 'proprietaire',
              attributes: ['nom_entreprise']
            }]
          }],
          order: [['date', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!prestataire) {
      return sendError(res, 'Provider not found', 404);
    }

    // Calculate metrics
    const totalInterventions = prestataire.interventions.length;
    const completedInterventions = prestataire.interventions.filter(i => i.statut === 'TERMINEE').length;
    
    const prestataireData = {
      ...prestataire.toJSON(),
      metrics: {
        totalInterventions,
        completedInterventions,
        completionRate: totalInterventions > 0 ? (completedInterventions / totalInterventions * 100).toFixed(1) : 0,
        performanceRating: totalInterventions > 0 ? Math.round((completedInterventions / totalInterventions) * 5) : 0
      }
    };

    sendSuccess(res, prestataireData);
  } catch (error) {
    console.error('Get prestataire by ID error:', error);
    sendError(res, 'Failed to retrieve provider', 500, error.message);
  }
};

// POST /api/prestataires - Create provider with contract upload
const createPrestataire = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const prestataireData = {
      ...req.body,
      creer_par_id: req.userId,
      contrat: req.file ? req.file.filename : null
    };

    const prestataire = await PrestataireExterne.create(prestataireData);

    const createdPrestataire = await PrestataireExterne.findByPk(prestataire.id, {
      include: [{
        model: User,
        as: 'creerPar',
        attributes: ['id', 'nom', 'username']
      }]
    });

    sendSuccess(res, createdPrestataire, 'Provider created successfully', 201);
  } catch (error) {
    console.error('Create prestataire error:', error);
    sendError(res, 'Failed to create provider', 500, error.message);
  }
};

module.exports = {
  getAllPrestataires,
  getPrestataireById,
  createPrestataire,
  uploadContract: upload.single('contract')
};
