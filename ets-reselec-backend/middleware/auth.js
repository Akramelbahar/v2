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
    
    // Find user with role and permissions
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
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
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Attach user data to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role?.nom;
    req.userPermissions = user.role?.permissions?.map(p => `${p.module}:${p.action}`) || [];
    
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

// Check if user has required role
const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.'
        });
      }

      const userRole = req.userRole;
      
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          required: roles,
          current: userRole
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

// Check if user has required permission
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.'
        });
      }

      const userRole = req.userRole;
      const userPermissions = req.userPermissions;

      // Admin users have all permissions
      if (userRole === 'Admin' || userRole === 'Administrateur') {
        return next();
      }

      // Check if user has the required permission
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Permission required.',
          required: requiredPermission,
          current: userPermissions
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

// Check if user has any of the required permissions
const checkAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.'
        });
      }

      const userRole = req.userRole;
      const userPermissions = req.userPermissions;

      // Admin users have all permissions
      if (userRole === 'Admin' || userRole === 'Administrateur') {
        return next();
      }

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. One of these permissions is required.',
          required: permissions,
          current: userPermissions
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
        attributes: { exclude: ['password'] },
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
      
      if (user) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role?.nom;
        req.userPermissions = user.role?.permissions?.map(p => `${p.module}:${p.action}`) || [];
      }
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
  checkAnyPermission,
  optionalAuth
};