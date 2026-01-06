const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const firebase = require('./config/firebase');

// Routes
const pollRoutes = require('./routes/polls');
const quizRoutes = require('./routes/quizzes');
const wordCloudRoutes = require('./routes/wordClouds');
const qaRoutes = require('./routes/qa');
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/exports');
const sessionRoutes = require('./routes/sessions');
const presentationRoutes = require('./routes/presentations');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow connections from any origin for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['*'] // Allow all headers for maximum compatibility
  },
  pingTimeout: 180000, // 3 minutes ping timeout (much longer than client timeout)
  pingInterval: 10000, // Match client ping interval of 10 seconds
  transports: ['polling', 'websocket'], // Start with polling for compatibility
  connectTimeout: 45000, // Increase connection timeout to 45 seconds
  maxHttpBufferSize: 1e8, // Increase buffer size for larger payloads
  allowUpgrades: false // Prevent transport upgrades to maintain connection stability
});

// Log all socket connection attempts
io.engine.on('connection', (socket) => {
  console.log(`New socket.io engine connection: ${socket.id}, transport: ${socket.transport.name}`);
  
  socket.on('error', (err) => {
    console.error(`Socket engine error for ${socket.id}:`, err);
  });
});

// Using default in-memory adapter for Socket.IO
console.log('Using in-memory adapter for Socket.IO - horizontal scaling not supported');

// Enable CORS for all routes with more permissive settings for development
app.use(cors({
  origin: '*', // Allow requests from any origin for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure Helmet but disable some policies for development
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
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

// Mock data flag - will start with true and switch to false if Firebase is initialized
global.useMockData = process.env.USE_MOCK_DATA === 'true' || !firebase.isInitialized;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    mode: global.useMockData ? 'mock' : 'firebase',
    databaseConnected: firebase.isInitialized
  });
});

// Database health check
if (!firebase.isInitialized) {
  console.log('Firestore not initialized, using mock data mode');
  global.useMockData = true;
} else {
  console.log('Firestore initialized successfully');
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
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: true, 
    message: err.message || 'Internal Server Error'
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check at http://localhost:${PORT}/api/health`);
  console.log(`Server running in ${global.useMockData ? 'MOCK DATA' : 'FIREBASE'} mode`);
});

module.exports = { app, server, io };
