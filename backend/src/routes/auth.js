/**
 * Authentication routes for user login, registration, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { db } = require('../config/firebase');

// Users collection in Firestore
const getUsersCollection = () => db.collection('users');

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain a number')
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (!existingUser.empty) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store user in Firestore
    await usersCollection.doc(userId).set(user);
    logger.info(`New user registered: ${email}`);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', { error: error.message });
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user in Firestore
    const usersCollection = getUsersCollection();
    const userSnapshot = await usersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (userSnapshot.empty) {
      // Use same message to prevent user enumeration
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Update last login time
    await userDoc.ref.update({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message });
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', auth, (req, res) => {
  try {
    // Generate new token with same user data
    const token = generateToken(req.user);

    res.json({
      message: 'Token refreshed',
      token
    });
  } catch (error) {
    logger.error('Token refresh error:', { error: error.message });
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should delete token)
 */
router.post('/logout', auth, (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // For stateful sessions, you would invalidate the session here
  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    message: 'Logout successful'
  });
});

module.exports = router;
