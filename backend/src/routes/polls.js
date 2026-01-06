const express = require('express');
const Poll = require('../models/poll');
const sessionService = require('../services/sessionService');
const router = express.Router();

/**
 * @route GET /api/polls
 * @desc Get all polls for a session
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const polls = await Poll.getBySession(sessionId);
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/polls/:id
 * @desc Get a specific poll by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.getById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/polls
 * @desc Create a new poll
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, title, type, options } = req.body;
    
    if (!sessionId || !title || !type) {
      return res.status(400).json({ 
        error: 'Session ID, title, and type are required' 
      });
    }
    
    // Validate poll type
    const validTypes = ['multiple_choice', 'rating', 'open_ended'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid poll type. Must be one of: multiple_choice, rating, open_ended'
      });
    }
    
    // For multiple_choice, validate options
    if (type === 'multiple_choice' && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        error: 'Multiple choice polls require at least 2 options'
      });
    }
    
    const poll = await Poll.create({
      sessionId,
      title,
      type,
      options: options || []
    });
    
    res.status(201).json(poll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/polls/:id/responses
 * @desc Add a response to a poll
 */
router.post('/:id/responses', async (req, res) => {
  try {
    const pollId = req.params.id;
    const { optionId, rating, openResponse, userId, sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get poll to check type and validate response
    const poll = await Poll.getById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Validate response based on poll type
    if (poll.type === 'multiple_choice' && !optionId) {
      return res.status(400).json({ error: 'Option ID is required for multiple choice polls' });
    } else if (poll.type === 'rating' && (rating === undefined || rating === null)) {
      return res.status(400).json({ error: 'Rating is required for rating polls' });
    } else if (poll.type === 'open_ended' && !openResponse) {
      return res.status(400).json({ error: 'Open response is required for open-ended polls' });
    }
    
    // Add response
    // Store response in Firestore session responses collection
    await sessionService.addPollResponse(sessionId, pollId, optionId, userId);

    // Legacy/additional storage if required by relational model
    const response = await Poll.addResponse({
      pollId,
      optionId: optionId || null,
      rating: rating || null,
      openResponse: openResponse || null,
      userId
    });
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding poll response:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/polls/:id/responses
 * @desc Get responses for a poll
 */
router.get('/:id/responses', async (req, res) => {
  try {
    const { poll, responses } = await Poll.getResponses(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json({ poll, responses });
  } catch (error) {
    console.error('Error fetching poll responses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/polls/:id/active
 * @desc Update poll active status
 */
router.patch('/:id/active', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive boolean is required' });
    }
    
    const poll = await Poll.setActive(req.params.id, isActive);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error updating poll active status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/polls/:id
 * @desc Delete a poll
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await Poll.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;