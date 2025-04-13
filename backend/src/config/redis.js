/**
 * Mock Redis implementation using in-memory data structures
 * This file replaces the Redis dependency with simple in-memory alternatives
 */

// In-memory cache store
const cacheStore = new Map();

/**
 * Mock Redis client with basic functionality
 * @class MockRedisClient
 */
class MockRedisClient {
  constructor() {
    console.log('Using in-memory cache instead of Redis');
    this.store = cacheStore;
  }

  // Basic key-value operations
  async set(key, value, options = {}) {
    this.store.set(key, {
      value,
      expiresAt: options.ex ? Date.now() + (options.ex * 1000) : null
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

  // Pub/Sub simulation (does nothing in this mock version)
  publish() {
    return 0; // Simulate 0 clients received the message
  }

  subscribe() {
    // Do nothing
  }

  // Mock connection methods
  connect() {
    return Promise.resolve(this);
  }

  duplicate() {
    return new MockRedisClient();
  }

  // Event emitter interface simulation
  on(event, callback) {
    if (event === 'connect') {
      // Call the connect callback immediately
      setTimeout(callback, 0);
    }
    return this;
  }
}

/**
 * Does nothing - Socket.IO will use its default in-memory adapter
 * @param {Object} io - Socket.IO server instance
 */
const setupSocketIORedisAdapter = async (io) => {
  console.log('Using default in-memory adapter for Socket.IO');
  // Do nothing - Socket.IO will use its built-in adapter
  return;
};

/**
 * Create an in-memory cache client
 * @returns {Promise<Object>} Mock Redis client instance
 */
const createCacheClient = async () => {
  return new MockRedisClient();
};

module.exports = {
  setupSocketIORedisAdapter,
  createCacheClient
};
