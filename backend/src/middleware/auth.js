const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validate JWT_SECRET is properly configured
 */
const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (isProduction) {
      logger.error('CRITICAL: JWT_SECRET environment variable is not set in production');
      throw new Error('JWT_SECRET must be configured in production');
    }
    logger.warn('JWT_SECRET not set - using development fallback (NOT SAFE FOR PRODUCTION)');
    return 'dev-secret-not-for-production';
  }

  if (secret.length < 32) {
    logger.warn('JWT_SECRET is shorter than recommended (32+ characters)');
  }

  return secret;
};

const JWT_SECRET = validateJwtSecret();

/**
 * Check if development authentication bypass is enabled
 * This should ONLY be used for local development and testing
 */
const isDevAuthBypassEnabled = () => {
  // Never allow bypass in production
  if (isProduction) {
    return false;
  }

  // Only allow bypass if explicitly enabled via environment variable
  return process.env.ALLOW_DEV_AUTH_BYPASS === 'true';
};

/**
 * Authentication middleware
 * Verifies JWT tokens in request headers
 */
const auth = (req, res, next) => {
  // Development bypass (only if explicitly enabled and not in production)
  if (isDevAuthBypassEnabled()) {
    logger.debug('Auth middleware: Development bypass enabled, creating mock user');
    req.user = {
      id: 'dev-user',
      name: 'Development User',
      email: 'dev@example.com',
      role: 'user' // Default to regular user, not admin
    };
    return next();
  }

  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      logger.debug('Auth middleware: No Authorization header');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    // Support both "Bearer <token>" and just "<token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token === 'null' || token === 'undefined') {
      logger.debug('Auth middleware: Invalid or empty token');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid token format'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate token payload has required fields
    if (!decoded.id) {
      logger.warn('Auth middleware: Token missing required user ID');
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token payload invalid'
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Auth middleware: Token expired');
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.debug('Auth middleware: Invalid token signature');
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    logger.error('Auth middleware error:', { error: error.message });
    return res.status(401).json({
      error: 'Authentication failed',
      message: isProduction ? 'Authentication error' : error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token exists, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return next();
  }

  // Try to authenticate, but don't fail if it doesn't work
  auth(req, res, (err) => {
    // Ignore auth errors for optional auth
    next();
  });
};

/**
 * Role-based access control middleware
 * Use after auth middleware: router.get('/admin', auth, requireRole('admin'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied: insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Generate a JWT token for a user
 */
const generateToken = (user, expiresIn = '24h') => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn }
  );
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireRole = requireRole;
module.exports.generateToken = generateToken;
