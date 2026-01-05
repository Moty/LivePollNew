/**
 * Redis configuration with proper production support
 * Falls back to in-memory implementation only in development when Redis is not available
 */

const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';
const REDIS_URL = process.env.REDIS_URL;

// In-memory cache store (fallback for development)
const cacheStore = new Map();

/**
 * Mock Redis client with basic functionality (development fallback only)
 * @class MockRedisClient
 */
class MockRedisClient {
  constructor() {
    logger.warn('Using in-memory cache instead of Redis - NOT SUITABLE FOR PRODUCTION');
    this.store = cacheStore;
    this.connected = true;
  }

  async set(key, value, options = {}) {
    this.store.set(key, {
      value,
      expiresAt: options.EX ? Date.now() + (options.EX * 1000) : null
    });
    return 'OK';
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    // Check expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern) {
    // Simple pattern matching (only supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + (seconds * 1000);
    return 1;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    return Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000));
  }

  // Pub/Sub methods (no-op in mock)
  publish() { return 0; }
  subscribe() { }
  unsubscribe() { }
  psubscribe() { }
  punsubscribe() { }

  async connect() { return this; }
  async disconnect() { this.connected = false; }
  async quit() { this.connected = false; }

  duplicate() { return new MockRedisClient(); }

  on(event, callback) {
    if (event === 'connect' || event === 'ready') {
      setTimeout(callback, 0);
    }
    return this;
  }

  isOpen() { return this.connected; }
  isReady() { return this.connected; }
}

/**
 * Create a Redis client
 * Uses real Redis if REDIS_URL is provided, otherwise falls back to mock
 */
const createRedisClient = async () => {
  if (REDIS_URL) {
    try {
      // Dynamic import for optional redis dependency
      const { createClient } = require('redis');

      const client = createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Max retries exceeded');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      client.on('error', (err) => {
        logger.error('Redis client error:', { error: err.message });
      });

      client.on('connect', () => {
        logger.info('Redis client connected');
      });

      client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      await client.connect();
      logger.info('Redis connection established');
      return client;

    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        logger.warn('Redis package not installed. Install with: npm install redis');
      } else {
        logger.error('Failed to connect to Redis:', { error: err.message });
      }

      if (isProduction) {
        throw new Error('Redis connection required in production');
      }

      logger.warn('Falling back to in-memory cache for development');
      return new MockRedisClient();
    }
  }

  if (isProduction) {
    logger.error('REDIS_URL not set in production - Redis is required for horizontal scaling');
    throw new Error('REDIS_URL must be configured in production');
  }

  logger.info('REDIS_URL not set, using in-memory cache for development');
  return new MockRedisClient();
};

/**
 * Set up Socket.IO Redis adapter for horizontal scaling
 * @param {Object} io - Socket.IO server instance
 */
const setupSocketIORedisAdapter = async (io) => {
  if (!REDIS_URL) {
    if (isProduction) {
      logger.error('Cannot set up Socket.IO Redis adapter - REDIS_URL not configured');
      throw new Error('Redis required for Socket.IO in production');
    }

    logger.warn('Using default in-memory adapter for Socket.IO - horizontal scaling NOT supported');
    return;
  }

  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');

    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured - horizontal scaling enabled');

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      logger.warn('@socket.io/redis-adapter not installed. Install with: npm install @socket.io/redis-adapter redis');
    } else {
      logger.error('Failed to set up Socket.IO Redis adapter:', { error: err.message });
    }

    if (isProduction) {
      throw new Error('Socket.IO Redis adapter required in production');
    }

    logger.warn('Using in-memory adapter for Socket.IO - horizontal scaling NOT supported');
  }
};

/**
 * Create an in-memory or Redis cache client
 * @returns {Promise<Object>} Cache client instance
 */
const createCacheClient = async () => {
  return createRedisClient();
};

// Singleton cache client
let cacheClient = null;

/**
 * Get the cache client (creates one if not exists)
 */
const getCacheClient = async () => {
  if (!cacheClient) {
    cacheClient = await createCacheClient();
  }
  return cacheClient;
};

module.exports = {
  setupSocketIORedisAdapter,
  createCacheClient,
  getCacheClient,
  MockRedisClient // Exported for testing
};
