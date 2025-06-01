const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { roleValidations, permissionValidations, queryValidations, idValidation } = require('../middleware/validation');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  assignPermissionsToRole
} = require('../controllers/roleController');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// Permission routes (placed before parameterized routes)
// GET /api/roles/permissions/all - Get all permissions
router.get('/permissions/all', getAllPermissions);

// POST /api/roles/permissions - Create new permission
router.post('/permissions',
  permissionValidations.create,
  createPermission
);

// PUT /api/roles/permissions/:id - Update permission
router.put('/permissions/:id',
  permissionValidations.update,
  updatePermission
);

// DELETE /api/roles/permissions/:id - Delete permission
router.delete('/permissions/:id',
  idValidation,
  deletePermission
);

// Role routes
// GET /api/roles - List roles with pagination
router.get('/', 
  queryValidations.pagination,
  getAllRoles
);

// GET /api/roles/:id - Get role details
router.get('/:id', 
  idValidation,
  getRoleById
);

// POST /api/roles - Create new role
router.post('/',
  roleValidations.create,
  createRole
);

// PUT /api/roles/:id - Update role
router.put('/:id',
  roleValidations.update,
  updateRole
);

// DELETE /api/roles/:id - Delete role
router.delete('/:id',
  idValidation,
  deleteRole
);

// POST /api/roles/:id/permissions - Assign permissions to role
router.post('/:id/permissions',
  idValidation,
  roleValidations.assignPermissions,
  assignPermissionsToRole
);

module.exports = router;