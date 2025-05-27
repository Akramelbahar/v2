const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { clientValidations, queryValidations, idValidation } = require('../middleware/validation');
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientSectors
} = require('../controllers/clientController');

// All routes require authentication
router.use(verifyToken);

// GET /api/clients - List clients with search and pagination
router.get('/', 
  queryValidations.pagination,
  getAllClients
);

// GET /api/clients/sectors - Get unique business sectors
router.get('/sectors', getClientSectors);

// GET /api/clients/:id - Get client details
router.get('/:id', 
  idValidation,
  getClientById
);

// POST /api/clients - Create new client
router.post('/',
  clientValidations.create,
  createClient
);

// PUT /api/clients/:id - Update client information
router.put('/:id',
  clientValidations.update,
  updateClient
);

// DELETE /api/clients/:id - Delete client (Admin only)
router.delete('/:id',
  clientValidations.delete,
  checkRole('Admin'), // Only admins can delete clients
  deleteClient
);

module.exports = router;