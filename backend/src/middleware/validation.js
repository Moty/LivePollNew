/**
 * Validation middleware for API requests
 * Provides functions for validating different types of input data
 */

const { validationResult } = require('express-validator');

/**
 * Validates the request using express-validator rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object|void} Returns error response or continues to next middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Sanitizes and validates string input for XSS prevention
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (!input) return '';
  
  // Basic sanitization to prevent XSS
  return String(input)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
const isValidObjectId = (id) => {
  // Basic ObjectId validation (24 hex characters)
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates poll input data
 * @param {Object} pollData - Poll data to validate
 * @returns {Object} Validation result with error flag and message
 */
const validatePollData = (pollData) => {
  // TODO: Implement detailed poll data validation
  if (!pollData.question || pollData.question.trim() === '') {
    return { error: true, message: 'Poll question is required' };
  }
  
  if (!pollData.options || !Array.isArray(pollData.options) || pollData.options.length < 2) {
    return { error: true, message: 'Poll must have at least 2 options' };
  }
  
  return { error: false };
};

/**
 * Validates quiz input data
 * @param {Object} quizData - Quiz data to validate
 * @returns {Object} Validation result with error flag and message
 */
const validateQuizData = (quizData) => {
  // TODO: Implement detailed quiz data validation
  if (!quizData.title || quizData.title.trim() === '') {
    return { error: true, message: 'Quiz title is required' };
  }
  
  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return { error: true, message: 'Quiz must have at least one question' };
  }
  
  // Validate each question
  for (let i = 0; i < quizData.questions.length; i++) {
    const question = quizData.questions[i];
    
    if (!question.text || question.text.trim() === '') {
      return { error: true, message: `Question ${i + 1} must have text` };
    }
    
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      return { error: true, message: `Question ${i + 1} must have at least 2 options` };
    }
    
    if (question.correctOptionIndex === undefined || 
        question.correctOptionIndex < 0 || 
        question.correctOptionIndex >= question.options.length) {
      return { error: true, message: `Question ${i + 1} must have a valid correct option` };
    }
  }
  
  return { error: false };
};

/**
 * Validates word cloud input data
 * @param {Object} wordCloudData - Word cloud data to validate
 * @returns {Object} Validation result with error flag and message
 */
const validateWordCloudData = (wordCloudData) => {
  // TODO: Implement detailed word cloud data validation
  if (!wordCloudData.title || wordCloudData.title.trim() === '') {
    return { error: true, message: 'Word cloud title is required' };
  }
  
  return { error: false };
};

/**
 * Validates Q&A input data
 * @param {Object} qaData - Q&A data to validate
 * @returns {Object} Validation result with error flag and message
 */
const validateQAData = (qaData) => {
  // TODO: Implement detailed Q&A data validation
  if (!qaData.title || qaData.title.trim() === '') {
    return { error: true, message: 'Q&A title is required' };
  }
  
  return { error: false };
};

// Import content filter
const contentFilter = require('../utils/contentFilter');

/**
 * Filters inappropriate words from submissions
 * @param {string} text - Text to filter
 * @returns {string} Filtered text
 */
const filterInappropriateContent = (text) => {
  return contentFilter.filter(text);
};

/**
 * Check if content is appropriate for submission
 * @param {string} text - Text to check
 * @returns {Object} - { appropriate: boolean, reason?: string }
 */
const isContentAppropriate = (text) => {
  return contentFilter.isAppropriate(text);
};

/**
 * Validate user-submitted content
 * @param {string} text - Text to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, cleaned?: string, error?: string }
 */
const validateContent = (text, options = {}) => {
  return contentFilter.validate(text, options);
};

/**
 * Middleware to validate word cloud submissions
 */
const validateWordCloudSubmission = (req, res, next) => {
  const { word } = req.body;

  const validation = contentFilter.validate(word, {
    maxLength: 50,
    minLength: 1
  });

  if (!validation.valid) {
    return res.status(400).json({
      error: true,
      message: validation.error
    });
  }

  req.body.word = validation.cleaned;
  next();
};

/**
 * Middleware to validate Q&A submissions
 */
const validateQASubmission = (req, res, next) => {
  const { question, answer } = req.body;

  if (question) {
    const validation = contentFilter.validate(question, {
      maxLength: 500,
      minLength: 5
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: true,
        message: `Question: ${validation.error}`
      });
    }

    req.body.question = validation.cleaned;
  }

  if (answer) {
    const validation = contentFilter.validate(answer, {
      maxLength: 1000,
      minLength: 1
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: true,
        message: `Answer: ${validation.error}`
      });
    }

    req.body.answer = validation.cleaned;
  }

  next();
};

module.exports = {
  validateRequest,
  sanitizeString,
  isValidObjectId,
  validatePollData,
  validateQuizData,
  validateWordCloudData,
  validateQAData,
  filterInappropriateContent,
  isContentAppropriate,
  validateContent,
  validateWordCloudSubmission,
  validateQASubmission,
  contentFilter
};