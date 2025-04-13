const express = require('express');
const Survey = require('../models/survey');
const router = express.Router();

/**
 * @route GET /api/surveys
 * @desc Get all surveys for a session
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const surveys = await Survey.getBySession(sessionId);
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/surveys/:id
 * @desc Get a specific survey by ID with questions and options
 */
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.getById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/surveys
 * @desc Create a new survey
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, title, description } = req.body;
    
    if (!sessionId || !title) {
      return res.status(400).json({
        error: 'Session ID and title are required'
      });
    }
    
    const survey = await Survey.create({
      sessionId,
      title,
      description
    });
    
    res.status(201).json(survey);
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/surveys/:id/questions
 * @desc Add a question to a survey
 */
router.post('/:id/questions', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const { text, type, order, required, options } = req.body;
    
    if (!text || !type) {
      return res.status(400).json({
        error: 'Question text and type are required'
      });
    }
    
    // Validate question type
    const validTypes = ['multiple_choice', 'rating', 'text'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid question type. Must be one of: multiple_choice, rating, text'
      });
    }
    
    // For multiple_choice, validate options
    if (type === 'multiple_choice' && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        error: 'Multiple choice questions require at least 2 options'
      });
    }
    
    const question = await Survey.addQuestion({
      surveyId,
      text,
      type,
      order: order || 0,
      required: required || false,
      options: options || []
    });
    
    res.status(201).json(question);
  } catch (error) {
    console.error('Error adding survey question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/surveys/:id/submit
 * @desc Submit responses to a survey
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const { userId, responses } = req.body;
    
    if (!userId || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        error: 'User ID and at least one response are required'
      });
    }
    
    // Validate that the survey is active
    const survey = await Survey.getById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    if (!survey.is_active) {
      return res.status(400).json({ error: 'Survey is not active' });
    }
    
    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required).map(q => q.id);
    const answeredQuestions = responses.map(r => r.questionId);
    
    const missingRequired = requiredQuestions.filter(qId => !answeredQuestions.includes(qId));
    if (missingRequired.length > 0) {
      return res.status(400).json({
        error: 'Required questions must be answered',
        missingQuestions: missingRequired
      });
    }
    
    const submission = await Survey.submitResponse({
      surveyId,
      userId,
      responses
    });
    
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting survey responses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/surveys/:id/results
 * @desc Get survey results
 */
router.get('/:id/results', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const results = await Survey.getResults(surveyId);
    
    if (!results) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/surveys/:id/export
 * @desc Export survey data (for CSV/Excel)
 */
router.get('/:id/export', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const exportData = await Survey.exportData(surveyId);
    
    if (!exportData) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting survey data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/surveys/:id/active
 * @desc Update survey active status
 */
router.patch('/:id/active', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive boolean is required'
      });
    }
    
    const survey = await Survey.setActive(surveyId, isActive);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    console.error('Error updating survey active status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/surveys/:id
 * @desc Delete a survey
 */
router.delete('/:id', async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const success = await Survey.delete(surveyId);
    
    if (!success) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;