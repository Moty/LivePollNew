const express = require('express');
const Quiz = require('../models/quiz');
const router = express.Router();

/**
 * @route GET /api/quizzes
 * @desc Get all quizzes for a session
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const quizzes = await Quiz.getBySession(sessionId);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/quizzes/:id
 * @desc Get a specific quiz by ID with all questions and options
 */
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.getById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/quizzes/:id/public
 * @desc Get a public version of the quiz (hides correct answers)
 */
router.get('/:id/public', async (req, res) => {
  try {
    const quiz = await Quiz.getPublicQuiz(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching public quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/quizzes
 * @desc Create a new quiz
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, title, questions } = req.body;
    
    if (!sessionId || !title) {
      return res.status(400).json({
        error: 'Session ID and title are required'
      });
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      sessionId,
      title,
      questions: questions || []
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/quizzes/:id/answer
 * @desc Submit an answer to a quiz question
 */
router.post('/:id/answer', async (req, res) => {
  try {
    const { questionId, optionId, userId, timeSpent } = req.body;
    
    if (!questionId || !optionId || !userId) {
      return res.status(400).json({
        error: 'Question ID, option ID, and user ID are required'
      });
    }
    
    const result = await Quiz.recordAnswer({
      questionId,
      optionId,
      userId,
      timeSpent: timeSpent || null
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error recording quiz answer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/quizzes/:id/results
 * @desc Get results for a quiz
 */
router.get('/:id/results', async (req, res) => {
  try {
    const results = await Quiz.getResults(req.params.id);
    
    if (!results) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/quizzes/:id/active
 * @desc Update quiz active status
 */
router.patch('/:id/active', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive boolean is required'
      });
    }
    
    const quiz = await Quiz.setActive(req.params.id, isActive);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz active status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/quizzes/:id
 * @desc Delete a quiz
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await Quiz.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;