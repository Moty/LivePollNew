const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT tokens in request headers
 */
const auth = (req, res, next) => {
  // For development, allow requests without authentication
  // Using a more flexible check to ensure development mode works reliably
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('Auth middleware: Development mode detected, skipping authentication');
    req.user = { 
      id: 'dev-user',
      name: 'Development User',
      email: 'dev@example.com',
      role: 'admin'
    };
    return next();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = auth;