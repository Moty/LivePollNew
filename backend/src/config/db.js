const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

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
    }
  };
} else {
  // Local development configuration
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'livepoll',
  };
}

// Create a connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on PostgreSQL client', err);
  process.exit(-1);
});

// Export the query function and client methods
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};