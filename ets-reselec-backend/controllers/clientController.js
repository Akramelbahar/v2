// ets-reselec-backend/controllers/clientController.js
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Client, User, Equipment, Intervention, sequelize } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');

// GET /api/clients
const getAllClients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      secteur_activite,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nom_entreprise: { [Op.like]: `%${search}%` } },
        { secteur_activite: { [Op.like]: `%${search}%` } },
        { ville: { [Op.like]: `%${search}%` } },
        { contact_principal: { [Op.like]: `%${search}%` } }
      ];
    }

    if (secteur_activite) {
      whereClause.secteur_activite = secteur_activite;
    }

    // Execute query with basic attributes first
    const { count, rows } = await Client.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creerPar',
        attributes: ['id', 'nom', 'username'],
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    // Add equipment count to each client
    const clientsWithCount = await Promise.all(
      rows.map(async (client) => {
        const equipmentCount = await Equipment.count({
          where: { proprietaire_id: client.id }
        });
        return {
          ...client.toJSON(),
          equipmentCount
        };
      })
    );

    sendPaginatedResponse(res, clientsWithCount, page, limit, count);

  } catch (error) {
    console.error('Get clients error:', error);
    sendError(res, 'Failed to retrieve clients', 500, error.message);
  }
};

// GET /api/clients/:id
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creerPar',
          attributes: ['id', 'nom', 'username'],
          required: false
        }
      ]
    });

    if (!client) {
      return sendError(res, 'Client not found', 404);
    }

    // Get equipment count
    const equipmentCount = await Equipment.count({
      where: { proprietaire_id: id }
    });

    // Get recent equipment
    const equipment = await Equipment.findAll({
      where: { proprietaire_id: id },
      attributes: ['id', 'nom', 'marque', 'modele', 'type_equipement', 'cout'],
      limit: 5,
      order: [['id', 'DESC']]
    });

    const clientData = {
      ...client.toJSON(),
      equipmentCount,
      equipment
    };

    sendSuccess(res, clientData);

  } catch (error) {
    console.error('Get client by ID error:', error);
    sendError(res, 'Failed to retrieve client', 500, error.message);
  }
};

// POST /api/clients
const createClient = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const clientData = {
      ...req.body,
      cree_par_id: req.userId
    };

    const client = await Client.create(clientData);
    
    // Reload with associations
    const createdClient = await Client.findByPk(client.id, {
      include: [{
        model: User,
        as: 'creerPar',
        attributes: ['id', 'nom', 'username'],
        required: false
      }]
    });

    sendSuccess(res, createdClient, 'Client created successfully', 201);

  } catch (error) {
    console.error('Create client error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Client with this information already exists', 400);
    }
    sendError(res, 'Failed to create client', 500, error.message);
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;

    const client = await Client.findByPk(id);
    if (!client) {
      return sendError(res, 'Client not found', 404);
    }

    // Update client
    await client.update(req.body);

    // Reload with associations
    const updatedClient = await Client.findByPk(id, {
      include: [{
        model: User,
        as: 'creerPar',
        attributes: ['id', 'nom', 'username'],
        required: false
      }]
    });

    sendSuccess(res, updatedClient, 'Client updated successfully');

  } catch (error) {
    console.error('Update client error:', error);
    sendError(res, 'Failed to update client', 500, error.message);
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);
    if (!client) {
      return sendError(res, 'Client not found', 404);
    }

    // Check for dependencies
    const equipmentCount = await Equipment.count({
      where: { proprietaire_id: id }
    });

    if (equipmentCount > 0) {
      return sendError(res, 
        `Cannot delete client. ${equipmentCount} equipment items are associated with this client.`, 
        400
      );
    }

    await client.destroy();

    sendSuccess(res, null, 'Client deleted successfully');

  } catch (error) {
    console.error('Delete client error:', error);
    sendError(res, 'Failed to delete client', 500, error.message);
  }
};

// GET /api/clients/sectors
const getClientSectors = async (req, res) => {
  try {
    const sectors = await Client.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('secteur_activite')), 'secteur_activite']
      ],
      where: {
        secteur_activite: { [Op.not]: null }
      },
      order: [['secteur_activite', 'ASC']]
    });

    const sectorList = sectors
      .map(s => s.secteur_activite)
      .filter(Boolean);

    sendSuccess(res, sectorList);

  } catch (error) {
    console.error('Get sectors error:', error);
    sendError(res, 'Failed to retrieve sectors', 500, error.message);
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientSectors
};