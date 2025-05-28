const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const equipmentRoutes = require('./routes/equipment');
const interventionRoutes = require('./routes/interventions');
const dashboardRoutes = require('./routes/dashboard');

const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');

// Add these lines after existing route usage:


const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ETS RESELEC API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'ETS RESELEC API Documentation',
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'User login',
        'POST /api/auth/register': 'User registration',
        'GET /api/auth/profile': 'Get current user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/refresh-token': 'Refresh JWT token',
        'POST /api/auth/logout': 'User logout'
      },
      clients: {
        'GET /api/clients': 'List clients with pagination and search',
        'GET /api/clients/sectors': 'Get business sectors',
        'GET /api/clients/:id': 'Get client details',
        'POST /api/clients': 'Create new client',
        'PUT /api/clients/:id': 'Update client',
        'DELETE /api/clients/:id': 'Delete client (Admin only)'
      },
      equipment: {
        'GET /api/equipment': 'List equipment with filters',
        'GET /api/equipment/types': 'Get equipment types',
        'GET /api/equipment/:id': 'Get equipment details',
        'POST /api/equipment': 'Create new equipment',
        'PUT /api/equipment/:id': 'Update equipment',
        'DELETE /api/equipment/:id': 'Delete equipment (Admin only)'
      },
      interventions: {
        'GET /api/interventions': 'List interventions with filters',
        'GET /api/interventions/status-counts': 'Get status counts',
        'GET /api/interventions/:id': 'Get intervention details',
        'POST /api/interventions': 'Create new intervention',
        'GET /api/interventions/:id/workflow': 'Get workflow status',
        'POST /api/interventions/:id/diagnostic': 'Create/update diagnostic',
        'PUT /api/interventions/:id/planification': 'Update planning',
        'POST /api/interventions/:id/controle-qualite': 'Add quality control',
        'PUT /api/interventions/:id/status': 'Update status'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Get dashboard statistics',
        'GET /api/dashboard/recent-interventions': 'Get recent interventions',
        'GET /api/dashboard/alerts': 'Get alerts and notifications',
        'GET /api/dashboard/charts': 'Get chart data',
        'GET /api/dashboard/performance': 'Get performance metrics'
      }
    }
  });
});
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: '/api/docs'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connected successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();