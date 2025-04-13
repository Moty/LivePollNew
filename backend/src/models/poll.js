const db = require('../config/db');

/**
 * Poll Model
 * Handles database operations for polls (multiple choice, ratings, or open-ended)
 */
const Poll = {
  /**
   * Create a new poll
   * @param {Object} poll - Poll data
   * @param {string} poll.sessionId - Session ID
   * @param {string} poll.title - Poll title/question
   * @param {string} poll.type - Poll type (multiple_choice, rating, open_ended)
   * @param {Object[]} [poll.options] - Poll options (for multiple choice polls)
   * @returns {Promise} - Newly created poll
   */
  async create(poll) {
    // First, insert the poll
    const pollResult = await db.query(
      `INSERT INTO polls (session_id, title, type, created_at, is_active)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [poll.sessionId, poll.title, poll.type, true]
    );
    
    const newPoll = pollResult.rows[0];
    
    // If multiple_choice type, insert options
    if (poll.type === 'multiple_choice' && Array.isArray(poll.options) && poll.options.length > 0) {
      for (const option of poll.options) {
        await db.query(
          `INSERT INTO poll_options (poll_id, text) 
           VALUES ($1, $2)`,
          [newPoll.id, option.text]
        );
      }
      
      // Fetch the poll with options
      const pollWithOptions = await this.getById(newPoll.id);
      return pollWithOptions;
    }
    
    return newPoll;
  },
  
  /**
   * Get poll by ID with its options
   * @param {number} id - Poll ID
   * @returns {Promise} - Poll with options
   */
  async getById(id) {
    // Fetch poll
    const pollResult = await db.query(
      'SELECT * FROM polls WHERE id = $1',
      [id]
    );
    
    if (pollResult.rows.length === 0) {
      return null;
    }
    
    const poll = pollResult.rows[0];
    
    // Fetch options if applicable
    if (poll.type === 'multiple_choice') {
      const optionsResult = await db.query(
        'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id',
        [id]
      );
      
      poll.options = optionsResult.rows;
    }
    
    return poll;
  },
  
  /**
   * Get polls by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Array of polls
   */
  async getBySession(sessionId) {
    const pollsResult = await db.query(
      'SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );
    
    const polls = pollsResult.rows;
    
    // Fetch options for multiple_choice polls
    for (const poll of polls) {
      if (poll.type === 'multiple_choice') {
        const optionsResult = await db.query(
          'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id',
          [poll.id]
        );
        
        poll.options = optionsResult.rows;
      }
    }
    
    return polls;
  },
  
  /**
   * Record a response to a poll
   * @param {Object} response - Poll response data 
   * @param {number} response.pollId - Poll ID
   * @param {number} [response.optionId] - Option ID (for multiple_choice)
   * @param {number} [response.rating] - Rating value (for rating type)
   * @param {string} [response.openResponse] - Text response (for open_ended)
   * @param {string} response.userId - User ID (anonymous or authenticated)
   * @returns {Promise} - Added response
   */
  async addResponse(response) {
    const result = await db.query(
      `INSERT INTO poll_responses 
       (poll_id, option_id, rating, open_response, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        response.pollId,
        response.optionId || null,
        response.rating || null,
        response.openResponse || null,
        response.userId
      ]
    );
    
    return result.rows[0];
  },
  
  /**
   * Get responses for a poll
   * @param {number} pollId - Poll ID
   * @returns {Promise} - Poll responses
   */
  async getResponses(pollId) {
    const pollResult = await db.query(
      'SELECT * FROM polls WHERE id = $1',
      [pollId]
    );
    
    if (pollResult.rows.length === 0) {
      return { poll: null, responses: [] };
    }
    
    const poll = pollResult.rows[0];
    let responses;
    
    // Fetch responses based on poll type
    if (poll.type === 'multiple_choice') {
      // For multiple choice, count responses per option
      const responsesResult = await db.query(
        `SELECT po.id, po.text, COUNT(pr.id) as count
         FROM poll_options po
         LEFT JOIN poll_responses pr ON po.id = pr.option_id
         WHERE po.poll_id = $1
         GROUP BY po.id, po.text
         ORDER BY po.id`,
        [pollId]
      );
      
      responses = responsesResult.rows;
    } else if (poll.type === 'rating') {
      // For rating, get average and distribution
      const avgResult = await db.query(
        'SELECT AVG(rating) as average FROM poll_responses WHERE poll_id = $1',
        [pollId]
      );
      
      const distributionResult = await db.query(
        `SELECT rating, COUNT(*) as count
         FROM poll_responses
         WHERE poll_id = $1
         GROUP BY rating
         ORDER BY rating`,
        [pollId]
      );
      
      responses = {
        average: avgResult.rows[0]?.average || 0,
        distribution: distributionResult.rows
      };
    } else {
      // For open-ended, get all text responses
      const responsesResult = await db.query(
        `SELECT id, open_response, user_id, created_at
         FROM poll_responses
         WHERE poll_id = $1
         ORDER BY created_at DESC`,
        [pollId]
      );
      
      responses = responsesResult.rows;
    }
    
    return { poll, responses };
  },
  
  /**
   * Update poll is_active status
   * @param {number} id - Poll ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - Updated poll
   */
  async setActive(id, isActive) {
    const result = await db.query(
      'UPDATE polls SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    return result.rows[0];
  },

  /**
   * Delete a poll and its related data
   * @param {number} id - Poll ID
   * @returns {Promise} - Success status
   */
  async delete(id) {
    // Delete responses first (foreign key constraint)
    await db.query(
      'DELETE FROM poll_responses WHERE poll_id = $1',
      [id]
    );
    
    // Delete options (if any)
    await db.query(
      'DELETE FROM poll_options WHERE poll_id = $1',
      [id]
    );
    
    // Delete the poll
    const result = await db.query(
      'DELETE FROM polls WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  }
};

module.exports = Poll;