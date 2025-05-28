const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      }]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

// Check if user has required role(s) - accepts multiple role names
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.'
        });
      }

      // Get user with role if not already loaded
      let userWithRole = req.user;
      if (!userWithRole.role) {
        userWithRole = await User.findByPk(req.user.id, {
          include: [{
            model: Role,
            as: 'role'
          }]
        });
      }

      // Check if user has any of the allowed roles
      const userRole = userWithRole.role?.nom;
      const hasPermission = allowedRoles.includes(userRole);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole || 'None'}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Role verification failed.',
        error: error.message
      });
    }
  };
};

// Check if user has specific permission
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.'
        });
      }

      // Get user with role and permissions if not already loaded
      let userWithRole = req.user;
      if (!userWithRole.role || !userWithRole.role.permissions) {
        userWithRole = await User.findByPk(req.user.id, {
          include: [{
            model: Role,
            as: 'role',
            include: [{
              model: Permission,
              as: 'permissions'
            }]
          }]
        });
      }

      // Admin has all permissions
      if (userWithRole.role?.nom === 'Administrateur') {
        return next();
      }

      // Check if user has the required permission
      const permissions = userWithRole.role?.permissions || [];
      const hasPermission = permissions.some(permission => 
        `${permission.module}:${permission.action}` === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission verification failed.',
        error: error.message
      });
    }
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      req.user = user;
      req.userId = user?.id;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  verifyToken,
  checkRole,
  checkPermission,
  optionalAuth
};