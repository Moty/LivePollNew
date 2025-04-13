const express = require('express');
const QA = require('../models/qa');
const router = express.Router();

/**
 * @route GET /api/qa/sessions
 * @desc Get all Q&A sessions for a presentation session
 */
router.get('/sessions', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const qaSessions = await QA.getSessionsByPresentation(sessionId);
    res.json(qaSessions);
  } catch (error) {
    console.error('Error fetching Q&A sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/qa/sessions/:id
 * @desc Get a specific Q&A session by ID with all questions
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const qaSession = await QA.getSessionById(req.params.id);
    
    if (!qaSession) {
      return res.status(404).json({ error: 'Q&A session not found' });
    }
    
    res.json(qaSession);
  } catch (error) {
    console.error('Error fetching Q&A session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/qa/sessions
 * @desc Create a new Q&A session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { sessionId, title, moderationEnabled } = req.body;
    
    if (!sessionId || !title) {
      return res.status(400).json({
        error: 'Session ID and title are required'
      });
    }
    
    const qaSession = await QA.createSession({
      sessionId,
      title,
      moderationEnabled: moderationEnabled || false
    });
    
    res.status(201).json(qaSession);
  } catch (error) {
    console.error('Error creating Q&A session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/qa/questions
 * @desc Add a question to a Q&A session
 */
router.post('/questions', async (req, res) => {
  try {
    const { qaSessionId, text, userId, userName } = req.body;
    
    if (!qaSessionId || !text || !userId) {
      return res.status(400).json({
        error: 'Q&A session ID, question text, and user ID are required'
      });
    }
    
    const question = await QA.addQuestion({
      qaSessionId,
      text,
      userId,
      userName
    });
    
    res.status(201).json(question);
  } catch (error) {
    if (error.message === 'Q&A session is not active') {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/qa/questions/:id/upvote
 * @desc Upvote a question
 */
router.post('/questions/:id/upvote', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }
    
    const result = await QA.upvoteQuestion({
      questionId,
      userId
    });
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'User has already upvoted this question') {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Error upvoting question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/qa/questions/:id/visibility
 * @desc Update question visibility (for moderation)
 */
router.patch('/questions/:id/visibility', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { isHidden } = req.body;
    
    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({
        error: 'isHidden boolean is required'
      });
    }
    
    const question = await QA.updateVisibility(questionId, isHidden);
    res.json(question);
  } catch (error) {
    console.error('Error updating question visibility:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/qa/questions/:id/answered
 * @desc Mark a question as answered
 */
router.patch('/questions/:id/answered', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { isAnswered } = req.body;
    
    if (typeof isAnswered !== 'boolean') {
      return res.status(400).json({
        error: 'isAnswered boolean is required'
      });
    }
    
    const question = await QA.updateAnsweredStatus(questionId, isAnswered);
    res.json(question);
  } catch (error) {
    console.error('Error updating question answered status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/qa/sessions/:id/active
 * @desc Update Q&A session active status
 */
router.patch('/sessions/:id/active', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive boolean is required'
      });
    }
    
    const qaSession = await QA.setSessionActive(sessionId, isActive);
    
    if (!qaSession) {
      return res.status(404).json({ error: 'Q&A session not found' });
    }
    
    res.json(qaSession);
  } catch (error) {
    console.error('Error updating Q&A session active status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/qa/sessions/:id/moderation
 * @desc Update Q&A session moderation settings
 */
router.patch('/sessions/:id/moderation', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { moderationEnabled } = req.body;
    
    if (typeof moderationEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'moderationEnabled boolean is required'
      });
    }
    
    const qaSession = await QA.setModeration(sessionId, moderationEnabled);
    
    if (!qaSession) {
      return res.status(404).json({ error: 'Q&A session not found' });
    }
    
    res.json(qaSession);
  } catch (error) {
    console.error('Error updating Q&A session moderation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/qa/sessions/:id
 * @desc Delete a Q&A session
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    const success = await QA.deleteSession(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Q&A session not found' });
    }
    
    res.json({ message: 'Q&A session deleted successfully' });
  } catch (error) {
    console.error('Error deleting Q&A session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;