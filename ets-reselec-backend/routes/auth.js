const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authValidations } = require('../middleware/validation');
const {
  login,
  register,
  getProfile,
  updateProfile,
  refreshToken,
  logout
} = require('../controllers/authController');

// Public routes
// POST /api/auth/login - User login
router.post('/login', 
  authValidations.login,
  login
);

// POST /api/auth/register - User registration  
router.post('/register',
  authValidations.register,
  register
);

// POST /api/auth/refresh-token - Refresh JWT token
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
// GET /api/auth/profile - Get current user profile
router.get('/profile', 
  verifyToken,
  getProfile
);

// PUT /api/auth/profile - Update user profile
router.put('/profile',
  verifyToken,
  authValidations.updateProfile,
  updateProfile
);

// POST /api/auth/logout - User logout
router.post('/logout',
  verifyToken,
  logout
);

module.exports = router;