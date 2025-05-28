const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User, Role, Permission } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper function to get user with complete role and permissions
const getUserWithRoleAndPermissions = async (userId) => {
  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{
      model: Role,
      as: 'role',
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'module', 'action', 'description'],
        through: { attributes: [] } // Exclude junction table attributes
      }]
    }]
  });
};

// Format user response with proper role and permissions
const formatUserResponse = (user) => {
  if (!user) return null;
  
  const userObj = user.toJSON();
  
  // Format permissions as array of strings (module:action)
  const permissions = user.role?.permissions?.map(p => `${p.module}:${p.action}`) || [];
  
  return {
    id: userObj.id,
    nom: userObj.nom,
    username: userObj.username,
    section: userObj.section,
    role: userObj.role?.nom || null,
    roleId: userObj.role?.id || null,
    permissions
  };
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { username, password } = req.body;

    // Find user by username with role and permissions
    const user = await User.findOne({ 
      where: { username },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'module', 'action', 'description'],
          through: { attributes: [] }
        }]
      }]
    });

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate token
    const token = user.generateToken();

    // Format user data
    const userData = formatUserResponse(user);

    sendSuccess(res, {
      token,
      user: userData
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500, error.message);
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, username, password, section, role_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return sendError(res, 'Username already exists', 400);
    }

    // Validate role exists
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return sendError(res, 'Invalid role specified', 400);
      }
    }

    // Create user with default role if none specified
    const user = await User.create({
      nom,
      username,
      password,
      section,
      role_id: role_id || 1 // Default to basic role
    });

    // Get user with complete role and permissions
    const userWithRole = await getUserWithRoleAndPermissions(user.id);

    // Generate token
    const token = user.generateToken();

    // Format user data
    const userData = formatUserResponse(userWithRole);

    sendSuccess(res, {
      token,
      user: userData
    }, 'User registered successfully', 201);

  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed', 500, error.message);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await getUserWithRoleAndPermissions(req.userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const userData = formatUserResponse(user);

    sendSuccess(res, userData, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to retrieve profile', 500, error.message);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { nom, section, currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update basic fields
    if (nom !== undefined) user.nom = nom;
    if (section !== undefined) user.section = section;
    
    // Handle password change
    if (currentPassword && newPassword) {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return sendError(res, 'Current password is incorrect', 401);
      }
      user.password = newPassword;
    }
    
    await user.save();

    // Get updated user with role and permissions
    const updatedUser = await getUserWithRoleAndPermissions(user.id);
    const userData = formatUserResponse(updatedUser);

    sendSuccess(res, userData, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 500, error.message);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 'Token is required', 400);
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with current role and permissions
    const user = await getUserWithRoleAndPermissions(decoded.id);
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    
    // Generate new token
    const newToken = generateToken(decoded.id);
    
    // Format user data
    const userData = formatUserResponse(user);

    sendSuccess(res, { 
      token: newToken,
      user: userData 
    }, 'Token refreshed successfully');

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    sendError(res, 'Token refresh failed', 500, error.message);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can use this endpoint for logging, blacklisting tokens, etc.
  sendSuccess(res, null, 'Logged out successfully');
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  refreshToken,
  logout
};