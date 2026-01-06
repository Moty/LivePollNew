const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const firebase = require('./config/firebase');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/polls');
const quizRoutes = require('./routes/quizzes');
const wordCloudRoutes = require('./routes/wordClouds');
const qaRoutes = require('./routes/qa');
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/exports');
const sessionRoutes = require('./routes/sessions');
const presentationRoutes = require('./routes/presentations');

// Environment validation
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : (isProduction ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']);

const app = express();
const server = http.createServer(app);

// CORS origin validation function
const validateOrigin = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, etc.) in development
  if (!origin && !isProduction) {
    return callback(null, true);
  }

  // In production, require ALLOWED_ORIGINS to be set
  if (isProduction && allowedOrigins.length === 0) {
    logger.warn('ALLOWED_ORIGINS not set in production - rejecting request');
    return callback(new Error('CORS not configured'), false);
  }

  if (allowedOrigins.includes(origin) || (!isProduction && !origin)) {
    return callback(null, true);
  }

  logger.warn(`Blocked request from unauthorized origin: ${origin}`);
  return callback(new Error('Not allowed by CORS'), false);
};

const io = socketIO(server, {
  cors: {
    origin: isProduction ? allowedOrigins : validateOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000, // 1 minute ping timeout
  pingInterval: 25000, // 25 seconds ping interval
  transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
  connectTimeout: 30000, // 30 second connection timeout
  maxHttpBufferSize: 1e6, // 1MB buffer (reasonable limit)
  allowUpgrades: true // Allow transport upgrades for better performance
});

// Log socket connection attempts (only in development or if explicitly enabled)
if (!isProduction || process.env.LOG_SOCKET_CONNECTIONS === 'true') {
  io.engine.on('connection', (socket) => {
    logger.debug(`Socket.io connection: ${socket.id}, transport: ${socket.transport.name}`);

    socket.on('error', (err) => {
      logger.error(`Socket engine error for ${socket.id}:`, err);
    });
  });
}

// Log adapter mode
logger.info(`Socket.IO adapter: ${process.env.REDIS_URL ? 'Redis' : 'in-memory'} (horizontal scaling ${process.env.REDIS_URL ? 'supported' : 'not supported'})`);

// Enable CORS for all routes with proper origin validation
app.use(cors({
  origin: validateOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Configure Helmet with production-appropriate security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // May need adjustment based on frontend needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  } : false, // Disable CSP in development for easier debugging
  crossOriginEmbedderPolicy: isProduction,
  crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : false,
  crossOriginResourcePolicy: isProduction ? { policy: 'same-origin' } : false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(compression());

// Use appropriate logging format based on environment
app.use(morgan(isProduction ? 'combined' : 'dev', {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.path === '/api/health' // Don't log health checks
}));

app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/wordclouds', wordCloudRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api', sessionRoutes);

// Socket.IO event handlers
require('./services/socketService')(io);

// Database mode configuration
// In production, mock data should only be used if explicitly enabled
if (isProduction) {
  global.useMockData = process.env.USE_MOCK_DATA === 'true';
  if (global.useMockData) {
    logger.warn('WARNING: Running in production with mock data enabled. This should only be used for testing.');
  }
} else {
  // In development, fall back to mock data if Firebase isn't available
  global.useMockData = process.env.USE_MOCK_DATA === 'true' || !firebase.isInitialized;
}

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: global.useMockData ? 'mock' : 'firebase',
      connected: firebase.isInitialized
    },
    uptime: process.uptime()
  };

  // In production, warn if using mock data
  if (isProduction && global.useMockData) {
    health.warning = 'Running with mock data in production';
    health.status = 'degraded';
  }

  // Check if database is required but not connected
  if (isProduction && !firebase.isInitialized && !global.useMockData) {
    health.status = 'unhealthy';
    health.error = 'Database not connected';
    return res.status(503).json(health);
  }

  res.status(200).json(health);
});

// Database initialization logging
if (!firebase.isInitialized) {
  if (isProduction && !global.useMockData) {
    logger.error('CRITICAL: Firestore not initialized in production mode');
  } else {
    logger.warn('Firestore not initialized, using mock data mode');
  }
} else {
  logger.info('Firestore initialized successfully');
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });
} else {
  // For development, add a catch-all route that helps with debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !res.headersSent) {
      res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
    } else {
      next();
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details (but not stack trace in production to avoid info leakage)
  logger.error('Server error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: isProduction ? undefined : err.stack
  });

  // Don't expose internal error details in production
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  logger.info(`Health check at http://localhost:${PORT}/api/health`);
  logger.info(`Database mode: ${global.useMockData ? 'MOCK DATA' : 'FIREBASE'}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error during server close:', err);
      process.exit(1);
    }

    logger.info('HTTP server closed');

    // Close all socket connections
    io.close(() => {
      logger.info('Socket.IO server closed');

      // Add any other cleanup here (database connections, etc.)
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, io };
