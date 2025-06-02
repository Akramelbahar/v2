const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const equipmentRoutes = require('./routes/equipment');
const interventionRoutes = require('./routes/interventions');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (if needed for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
});

// API routes
const apiRouter = express.Router();

// Mount routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/interventions', interventionRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/roles', roleRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ETS RESELEC API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API documentation endpoint
apiRouter.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'ETS RESELEC API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
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
      },
      users: {
        'GET /api/users': 'List users (Admin only)',
        'GET /api/users/:id': 'Get user details (Admin only)',
        'POST /api/users': 'Create new user (Admin only)',
        'PUT /api/users/:id': 'Update user (Admin only)',
        'DELETE /api/users/:id': 'Delete user (Admin only)',
        'POST /api/users/:id/reset-password': 'Reset user password (Admin only)',
        'PUT /api/users/:id/toggle-status': 'Toggle user status (Admin only)'
      },
      roles: {
        'GET /api/roles': 'List all roles',
        'GET /api/roles/:id': 'Get role details',
        'POST /api/roles': 'Create new role (Admin only)',
        'PUT /api/roles/:id': 'Update role (Admin only)',
        'DELETE /api/roles/:id': 'Delete role (Admin only)',
        'POST /api/roles/:id/permissions': 'Assign permissions (Admin only)',
        'GET /api/permissions': 'List all permissions'
      }
    }
  });
});

// Mount API router
app.use('/api', apiRouter);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../ets-reselec-frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ets-reselec-frontend/build', 'index.html'));
  });
}

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to send this to a logging service
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, log the error and restart the process
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Starting graceful shutdown...');
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    const { sequelize } = require('./config/database');
    sequelize.close().then(() => {
      console.log('✅ Database connections closed');
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error closing database connections:', err);
      process.exit(1);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

let server;

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connected successfully');
    
    // Check if we need to run migrations
    if (process.env.RUN_MIGRATIONS === 'true') {
      console.log('🔄 Running migrations...');
      const { runMigrations } = require('./database/run-migrations');
      await runMigrations();
    }
    
    // Start listening
    server = app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                    ETS RESELEC API                     ║
╚════════════════════════════════════════════════════════╝

🚀 Server is running on ${HOST}:${PORT}
📍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: http://localhost:${PORT}/api
📚 API Documentation: http://localhost:${PORT}/api/docs
🏥 Health Check: http://localhost:${PORT}/api/health

✨ Ready to handle requests!
      `);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;