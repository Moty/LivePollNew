/**
 * Session utilities for secure code generation and management
 */

const crypto = require('crypto');
const logger = require('./logger');

/**
 * Generate a cryptographically secure session code
 * Uses a larger character set and longer length for better security
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} - Uppercase alphanumeric code
 */
const generateSecureSessionCode = (length = 8) => {
  // Use only unambiguous characters (no 0/O, 1/I/L confusion)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.randomBytes(length);
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }

  return code;
};

/**
 * Generate a unique session code that doesn't exist in the provided set
 * @param {Set|Map} existingCodes - Set or Map of existing codes
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {string|null} - Unique code or null if failed
 */
const generateUniqueSessionCode = (existingCodes, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateSecureSessionCode();
    const exists = existingCodes instanceof Map
      ? existingCodes.has(code)
      : existingCodes.has(code);

    if (!exists) {
      return code;
    }
  }

  logger.error(`Failed to generate unique session code after ${maxAttempts} attempts`);
  return null;
};

/**
 * Validate a session code format
 * @param {string} code - Code to validate
 * @returns {boolean} - True if valid format
 */
const isValidSessionCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Must be 6-10 uppercase alphanumeric characters
  return /^[A-Z0-9]{6,10}$/.test(code);
};

/**
 * Rate limiter for socket events
 * Tracks event counts per socket and applies limits
 */
class SocketRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 100; // 100 requests per window
    this.blockDurationMs = options.blockDurationMs || 300000; // 5 minute block
    this.clients = new Map();
    this.blockedClients = new Map();

    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a client is rate limited
   * @param {string} clientId - Socket ID or IP address
   * @param {string} eventName - Name of the event (optional, for event-specific limits)
   * @returns {object} - { allowed: boolean, remaining: number, resetTime: number }
   */
  check(clientId, eventName = 'default') {
    const key = `${clientId}:${eventName}`;
    const now = Date.now();

    // Check if blocked
    const blockExpiry = this.blockedClients.get(key);
    if (blockExpiry && blockExpiry > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockExpiry,
        blocked: true
      };
    }

    // Remove expired block
    if (blockExpiry) {
      this.blockedClients.delete(key);
    }

    // Get or create client record
    let record = this.clients.get(key);
    if (!record || record.windowStart + this.windowMs < now) {
      // New window
      record = {
        windowStart: now,
        count: 0
      };
    }

    record.count++;
    this.clients.set(key, record);

    if (record.count > this.maxRequests) {
      // Block the client
      const blockUntil = now + this.blockDurationMs;
      this.blockedClients.set(key, blockUntil);
      logger.warn(`Rate limit exceeded for ${clientId} on event ${eventName}`, {
        count: record.count,
        limit: this.maxRequests
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        blocked: true
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.windowStart + this.windowMs,
      blocked: false
    };
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();

    // Clean up old rate limit windows
    for (const [key, record] of this.clients.entries()) {
      if (record.windowStart + this.windowMs < now) {
        this.clients.delete(key);
      }
    }

    // Clean up expired blocks
    for (const [key, expiry] of this.blockedClients.entries()) {
      if (expiry < now) {
        this.blockedClients.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clients.clear();
    this.blockedClients.clear();
  }
}

/**
 * Input validator for socket events
 */
const validateSocketInput = {
  /**
   * Validate session code input
   */
  sessionCode: (code) => {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Session code is required' };
    }
    if (!isValidSessionCode(code)) {
      return { valid: false, error: 'Invalid session code format' };
    }
    return { valid: true };
  },

  /**
   * Validate presentation ID
   */
  presentationId: (id) => {
    if (!id || typeof id !== 'string') {
      return { valid: false, error: 'Presentation ID is required' };
    }
    if (id.length > 100) {
      return { valid: false, error: 'Presentation ID too long' };
    }
    return { valid: true };
  },

  /**
   * Validate user name
   */
  userName: (name) => {
    if (!name || typeof name !== 'string') {
      return { valid: true, sanitized: 'Anonymous' };
    }
    // Sanitize: trim, limit length, remove special characters
    const sanitized = name
      .trim()
      .slice(0, 50)
      .replace(/[<>\"\'&]/g, '');
    return { valid: true, sanitized: sanitized || 'Anonymous' };
  },

  /**
   * Validate activity response data
   */
  activityResponse: (data, activityType) => {
    if (!data) {
      return { valid: false, error: 'Response data is required' };
    }

    switch (activityType) {
      case 'poll':
        if (typeof data.selectedOption !== 'number' || data.selectedOption < 0) {
          return { valid: false, error: 'Invalid poll option' };
        }
        break;

      case 'wordcloud':
        if (typeof data.word !== 'string' || data.word.length === 0) {
          return { valid: false, error: 'Word is required' };
        }
        if (data.word.length > 50) {
          return { valid: false, error: 'Word too long' };
        }
        break;

      case 'quiz':
        if (typeof data.answer === 'undefined') {
          return { valid: false, error: 'Answer is required' };
        }
        break;

      case 'qa':
        if (typeof data.question !== 'string' && typeof data.answer !== 'string') {
          return { valid: false, error: 'Question or answer is required' };
        }
        break;
    }

    return { valid: true };
  }
};

module.exports = {
  generateSecureSessionCode,
  generateUniqueSessionCode,
  isValidSessionCode,
  SocketRateLimiter,
  validateSocketInput
};
