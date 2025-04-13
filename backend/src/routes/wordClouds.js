const express = require('express');
const WordCloud = require('../models/wordCloud');
const router = express.Router();

/**
 * @route GET /api/wordclouds
 * @desc Get all word clouds for a session
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const wordClouds = await WordCloud.getBySession(sessionId);
    res.json(wordClouds);
  } catch (error) {
    console.error('Error fetching word clouds:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/wordclouds/:id
 * @desc Get a specific word cloud by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const wordCloud = await WordCloud.getById(req.params.id);
    
    if (!wordCloud) {
      return res.status(404).json({ error: 'Word cloud not found' });
    }
    
    res.json(wordCloud);
  } catch (error) {
    console.error('Error fetching word cloud:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/wordclouds
 * @desc Create a new word cloud
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, title } = req.body;
    
    if (!sessionId || !title) {
      return res.status(400).json({
        error: 'Session ID and title are required'
      });
    }
    
    const wordCloud = await WordCloud.create({
      sessionId,
      title
    });
    
    res.status(201).json(wordCloud);
  } catch (error) {
    console.error('Error creating word cloud:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/wordclouds/:id/words
 * @desc Add a word to a word cloud
 */
router.post('/:id/words', async (req, res) => {
  try {
    const wordCloudId = parseInt(req.params.id);
    const { word, userId } = req.body;
    
    if (!word || !userId) {
      return res.status(400).json({
        error: 'Word and user ID are required'
      });
    }
    
    // Validate word length
    if (word.length > 50) {
      return res.status(400).json({
        error: 'Word must be 50 characters or less'
      });
    }
    
    const submission = await WordCloud.addWord({
      wordCloudId,
      word,
      userId
    });
    
    res.status(201).json(submission);
  } catch (error) {
    if (error.message === 'Word cloud is not active' || error.message === 'Word cannot be empty') {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Error adding word:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/wordclouds/:id/words
 * @desc Get word frequency data for a word cloud
 */
router.get('/:id/words', async (req, res) => {
  try {
    const wordCloudId = parseInt(req.params.id);
    const wordFrequency = await WordCloud.getWordFrequency(wordCloudId);
    
    res.json(wordFrequency);
  } catch (error) {
    console.error('Error fetching word frequency:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PATCH /api/wordclouds/:id/active
 * @desc Update word cloud active status
 */
router.patch('/:id/active', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive boolean is required'
      });
    }
    
    const wordCloud = await WordCloud.setActive(req.params.id, isActive);
    
    if (!wordCloud) {
      return res.status(404).json({ error: 'Word cloud not found' });
    }
    
    res.json(wordCloud);
  } catch (error) {
    console.error('Error updating word cloud active status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/wordclouds/:id
 * @desc Delete a word cloud
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await WordCloud.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Word cloud not found' });
    }
    
    res.json({ message: 'Word cloud deleted successfully' });
  } catch (error) {
    console.error('Error deleting word cloud:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;