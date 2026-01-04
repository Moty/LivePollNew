const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Check for SAP BTP-specific environment variables
const vcapServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : {};

// Initialize database connection configuration
let dbConfig;

// If running on SAP BTP, extract PostgreSQL credentials from VCAP_SERVICES
if (vcapServices.postgresql) {
  const credentials = vcapServices.postgresql[0].credentials;
  dbConfig = {
    user: credentials.username,
    password: credentials.password,
    host: credentials.hostname,
    port: credentials.port,
    database: credentials.dbname,
    ssl: {
      rejectUnauthorized: false  // Required for SAP BTP
    },
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    allowExitOnIdle: false
  };
} else {
  // Local development configuration
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || (isProduction ? undefined : 'postgres'),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'livepoll',
    // SSL configuration for production
    ssl: isProduction ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    allowExitOnIdle: false
  };

  // Validate production configuration
  if (isProduction && !process.env.DB_PASSWORD) {
    logger.error('CRITICAL: DB_PASSWORD not set in production environment');
  }
}

// Create a connection pool
const pool = new Pool(dbConfig);

// Track pool statistics for monitoring
let poolStats = {
  totalConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
  errors: 0
};

// Connection event handlers
pool.on('connect', (client) => {
  poolStats.totalConnections++;
  logger.debug('PostgreSQL client connected', {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount
  });
});

pool.on('acquire', (client) => {
  logger.debug('PostgreSQL client acquired from pool');
});

pool.on('release', (client) => {
  logger.debug('PostgreSQL client released back to pool');
});

pool.on('remove', (client) => {
  logger.debug('PostgreSQL client removed from pool');
});

pool.on('error', (err, client) => {
  poolStats.errors++;
  logger.error('PostgreSQL pool error:', {
    message: err.message,
    code: err.code
  });
  // Don't exit the process - let the application handle errors gracefully
  // Individual queries will fail and can be retried
});

/**
 * Get current pool statistics
 */
const getPoolStats = () => ({
  totalConnections: pool.totalCount,
  idleConnections: pool.idleCount,
  waitingClients: pool.waitingCount,
  historicalStats: poolStats
});

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL connection test successful');
    return true;
  } catch (err) {
    logger.error('PostgreSQL connection test failed:', { error: err.message });
    return false;
  }
};

/**
 * Gracefully close the pool
 */
const closePool = async () => {
  logger.info('Closing PostgreSQL connection pool...');
  try {
    await pool.end();
    logger.info('PostgreSQL connection pool closed');
  } catch (err) {
    logger.error('Error closing PostgreSQL pool:', { error: err.message });
  }
};

/**
 * Execute a query with automatic retry for transient errors
 */
const queryWithRetry = async (text, params, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      lastError = err;

      // Only retry on connection errors, not query errors
      const isRetryable = err.code === 'ECONNREFUSED' ||
                          err.code === 'ETIMEDOUT' ||
                          err.code === '57P01' || // admin_shutdown
                          err.code === '57P02' || // crash_shutdown
                          err.code === '57P03';   // cannot_connect_now

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      logger.warn(`Database query failed, retrying in ${backoffMs}ms...`, {
        attempt,
        maxRetries,
        errorCode: err.code
      });

      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
};

// Export the query function and client methods
module.exports = {
  query: (text, params) => pool.query(text, params),
  queryWithRetry,
  getClient: () => pool.connect(),
  pool,
  getPoolStats,
  testConnection,
  closePool
};
