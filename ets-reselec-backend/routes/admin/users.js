// ets-reselec-backend/routes/admin/users.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../middleware/auth');
const { authValidations, idValidation } = require('../../middleware/validation');
const { User, Role, Section } = require('../../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(checkRole('Administrateur', 'Admin'));

// GET /api/admin/users - Get all users with pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role_id,
      section_id,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { section: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role filter
    if (role_id) {
      whereClause.role_id = role_id;
    }

    // Section filter
    if (section_id) {
      whereClause.section_id = section_id;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    sendPaginatedResponse(res, rows, page, limit, count);

  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
});

// GET /api/admin/users/:id - Get user by ID
router.get('/:id', idValidation, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user);

  } catch (error) {
    console.error('Get user by ID error:', error);
    sendError(res, 'Failed to retrieve user', 500, error.message);
  }
});

// POST /api/admin/users - Create new user
router.post('/', authValidations.register, async (req, res) => {
  try {
    const { nom, username, password, section, role_id, section_id } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return sendError(res, 'Username already exists', 400);
    }

    // Validate role if provided
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Validate section if provided
    if (section_id) {
      const sectionRecord = await Section.findByPk(section_id);
      if (!sectionRecord) {
        return sendError(res, 'Invalid section specified', 400);
      }
    }

    // Create user
    const user = await User.create({
      nom,
      username,
      password,
      section,
      role_id: role_id || 1,
      section_id
    });

    // Reload with associations
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    sendSuccess(res, createdUser, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', 500, error.message);
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/:id', [idValidation, authValidations.updateProfile], async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, section, role_id, section_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Validate role if provided
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Validate section if provided
    if (section_id) {
      const sectionRecord = await Section.findByPk(section_id);
      if (!sectionRecord) {
        return sendError(res, 'Invalid section specified', 400);
      }
    }

    // Update user
    await user.update({
      nom: nom || user.nom,
      section: section || user.section,
      role_id: role_id || user.role_id,
      section_id: section_id || user.section_id
    });

    // Reload with associations
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nom']
        },
        {
          model: Section,
          as: 'sectionBelongsTo',
          attributes: ['id', 'nom']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    sendSuccess(res, updatedUser, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500, error.message);
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', idValidation, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.userId) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user has created content that would be orphaned
    // You might want to add additional checks here

    await user.destroy();

    sendSuccess(res, null, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500, error.message);
  }
});

// PUT /api/admin/users/:id/password - Reset user password
router.put('/:id/password', [idValidation, authValidations.register], async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update password (will be hashed by model hook)
    await user.update({ password });

    sendSuccess(res, null, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password', 500, error.message);
  }
});

// GET /api/admin/users/roles - Get all roles
router.get('/data/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['nom', 'ASC']]
    });

    sendSuccess(res, roles);

  } catch (error) {
    console.error('Get roles error:', error);
    sendError(res, 'Failed to retrieve roles', 500, error.message);
  }
});

// GET /api/admin/users/sections - Get all sections
router.get('/data/sections', async (req, res) => {
  try {
    const sections = await Section.findAll({
      order: [['nom', 'ASC']]
    });

    sendSuccess(res, sections);

  } catch (error) {
    console.error('Get sections error:', error);
    sendError(res, 'Failed to retrieve sections', 500, error.message);
  }
});

module.exports = router;