const db = require('../config/db');

/**
 * WordCloud Model
 * Handles database operations for word clouds
 */
const WordCloud = {
  /**
   * Create a new word cloud
   * @param {Object} wordCloud - Word cloud data
   * @param {string} wordCloud.sessionId - Session ID
   * @param {string} wordCloud.title - Word cloud title/question
   * @returns {Promise} - Newly created word cloud
   */
  async create(wordCloud) {
    const result = await db.query(
      `INSERT INTO word_clouds (session_id, title, created_at, is_active)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [wordCloud.sessionId, wordCloud.title, true]
    );
    
    return result.rows[0];
  },
  
  /**
   * Get word cloud by ID
   * @param {number} id - Word cloud ID
   * @returns {Promise} - Word cloud
   */
  async getById(id) {
    const result = await db.query(
      'SELECT * FROM word_clouds WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const wordCloud = result.rows[0];
    
    // Get word submissions for this word cloud
    const wordsResult = await db.query(
      `SELECT word, COUNT(*) as frequency
       FROM word_cloud_submissions
       WHERE word_cloud_id = $1
       GROUP BY word
       ORDER BY frequency DESC`,
      [id]
    );
    
    wordCloud.words = wordsResult.rows;
    
    return wordCloud;
  },
  
  /**
   * Get word clouds by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Array of word clouds
   */
  async getBySession(sessionId) {
    const result = await db.query(
      'SELECT * FROM word_clouds WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );
    
    const wordClouds = result.rows;
    
    // Get word submissions for each word cloud
    for (const wordCloud of wordClouds) {
      const wordsResult = await db.query(
        `SELECT word, COUNT(*) as frequency
         FROM word_cloud_submissions
         WHERE word_cloud_id = $1
         GROUP BY word
         ORDER BY frequency DESC`,
        [wordCloud.id]
      );
      
      wordCloud.words = wordsResult.rows;
    }
    
    return wordClouds;
  },
  
  /**
   * Add a word submission to a word cloud
   * @param {Object} submission - Submission data
   * @param {number} submission.wordCloudId - Word cloud ID
   * @param {string} submission.word - Submitted word
   * @param {string} submission.userId - User ID (anonymous or authenticated)
   * @returns {Promise} - Added submission
   */
  async addWord(submission) {
    // Check if word cloud is active
    const wordCloudResult = await db.query(
      'SELECT is_active FROM word_clouds WHERE id = $1',
      [submission.wordCloudId]
    );
    
    if (wordCloudResult.rows.length === 0 || !wordCloudResult.rows[0].is_active) {
      throw new Error('Word cloud is not active');
    }
    
    // Process word (trim, lowercase)
    const processedWord = submission.word.trim().toLowerCase();
    
    if (!processedWord) {
      throw new Error('Word cannot be empty');
    }
    
    // Add submission
    const result = await db.query(
      `INSERT INTO word_cloud_submissions (word_cloud_id, word, user_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [submission.wordCloudId, processedWord, submission.userId]
    );
    
    return result.rows[0];
  },
  
  /**
   * Get word frequency data for a word cloud
   * @param {number} wordCloudId - Word cloud ID
   * @returns {Promise} - Word frequency data
   */
  async getWordFrequency(wordCloudId) {
    const result = await db.query(
      `SELECT word, COUNT(*) as frequency
       FROM word_cloud_submissions
       WHERE word_cloud_id = $1
       GROUP BY word
       ORDER BY frequency DESC`,
      [wordCloudId]
    );
    
    return result.rows;
  },
  
  /**
   * Update word cloud is_active status
   * @param {number} id - Word cloud ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - Updated word cloud
   */
  async setActive(id, isActive) {
    const result = await db.query(
      'UPDATE word_clouds SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    return result.rows[0];
  },

  /**
   * Delete a word cloud and its related submissions
   * @param {number} id - Word cloud ID
   * @returns {Promise} - Success status
   */
  async delete(id) {
    // Delete submissions first (foreign key constraint)
    await db.query(
      'DELETE FROM word_cloud_submissions WHERE word_cloud_id = $1',
      [id]
    );
    
    // Delete the word cloud
    const result = await db.query(
      'DELETE FROM word_clouds WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  }
};

module.exports = WordCloud;