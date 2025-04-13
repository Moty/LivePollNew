const db = require('../config/db');

/**
 * Q&A Model
 * Handles database operations for Q&A sessions (audience questions and upvotes)
 */
const QA = {
  /**
   * Create a new Q&A session
   * @param {Object} qaSession - Q&A session data
   * @param {string} qaSession.sessionId - Session ID
   * @param {string} qaSession.title - Q&A session title
   * @returns {Promise} - Newly created Q&A session
   */
  async createSession(qaSession) {
    const result = await db.query(
      `INSERT INTO qa_sessions (session_id, title, created_at, is_active, moderation_enabled)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING *`,
      [qaSession.sessionId, qaSession.title, true, qaSession.moderationEnabled || false]
    );
    
    return result.rows[0];
  },
  
  /**
   * Get Q&A session by ID
   * @param {number} id - Q&A session ID
   * @returns {Promise} - Q&A session with questions
   */
  async getSessionById(id) {
    // Fetch Q&A session
    const sessionResult = await db.query(
      'SELECT * FROM qa_sessions WHERE id = $1',
      [id]
    );
    
    if (sessionResult.rows.length === 0) {
      return null;
    }
    
    const session = sessionResult.rows[0];
    
    // Fetch questions for this session
    const questionsResult = await db.query(
      `SELECT q.*, 
              (SELECT COUNT(*) FROM question_upvotes WHERE question_id = q.id) as upvotes
       FROM questions q
       WHERE q.qa_session_id = $1 AND (q.is_hidden = false OR $2)
       ORDER BY upvotes DESC, q.created_at DESC`,
      [id, true] // Show hidden questions in admin view
    );
    
    session.questions = questionsResult.rows;
    
    return session;
  },
  
  /**
   * Get Q&A sessions by presentation session ID
   * @param {string} sessionId - Presentation session ID
   * @returns {Promise} - Array of Q&A sessions
   */
  async getSessionsByPresentation(sessionId) {
    const result = await db.query(
      'SELECT * FROM qa_sessions WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );
    
    return result.rows;
  },
  
  /**
   * Add a new question to a Q&A session
   * @param {Object} question - Question data
   * @param {number} question.qaSessionId - Q&A session ID
   * @param {string} question.text - Question text
   * @param {string} question.userId - User ID who asked the question
   * @param {string} [question.userName] - Optional user name
   * @returns {Promise} - Added question
   */
  async addQuestion(question) {
    // Check if session is active
    const sessionResult = await db.query(
      'SELECT is_active, moderation_enabled FROM qa_sessions WHERE id = $1',
      [question.qaSessionId]
    );
    
    if (sessionResult.rows.length === 0 || !sessionResult.rows[0].is_active) {
      throw new Error('Q&A session is not active');
    }
    
    // Set initial visibility based on moderation settings
    const isHidden = sessionResult.rows[0].moderation_enabled;
    
    const result = await db.query(
      `INSERT INTO questions 
       (qa_session_id, text, user_id, user_name, is_hidden, is_answered, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        question.qaSessionId, 
        question.text, 
        question.userId, 
        question.userName || null, 
        isHidden, 
        false
      ]
    );
    
    const newQuestion = result.rows[0];
    newQuestion.upvotes = 0;
    
    return newQuestion;
  },
  
  /**
   * Upvote a question
   * @param {Object} upvote - Upvote data
   * @param {number} upvote.questionId - Question ID
   * @param {string} upvote.userId - User ID
   * @returns {Promise} - Added upvote and new count
   */
  async upvoteQuestion(upvote) {
    // Check if user has already upvoted this question
    const existingUpvote = await db.query(
      'SELECT * FROM question_upvotes WHERE question_id = $1 AND user_id = $2',
      [upvote.questionId, upvote.userId]
    );
    
    if (existingUpvote.rows.length > 0) {
      throw new Error('User has already upvoted this question');
    }
    
    // Add upvote
    await db.query(
      `INSERT INTO question_upvotes (question_id, user_id, created_at)
       VALUES ($1, $2, NOW())`,
      [upvote.questionId, upvote.userId]
    );
    
    // Get new upvote count
    const countResult = await db.query(
      'SELECT COUNT(*) as upvotes FROM question_upvotes WHERE question_id = $1',
      [upvote.questionId]
    );
    
    return {
      questionId: upvote.questionId,
      userId: upvote.userId,
      upvotes: parseInt(countResult.rows[0].upvotes)
    };
  },
  
  /**
   * Update question visibility (for moderation)
   * @param {number} questionId - Question ID
   * @param {boolean} isHidden - Whether the question should be hidden
   * @returns {Promise} - Updated question
   */
  async updateVisibility(questionId, isHidden) {
    const result = await db.query(
      'UPDATE questions SET is_hidden = $1 WHERE id = $2 RETURNING *',
      [isHidden, questionId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Question not found');
    }
    
    // Add upvote count to response
    const countResult = await db.query(
      'SELECT COUNT(*) as upvotes FROM question_upvotes WHERE question_id = $1',
      [questionId]
    );
    
    const question = result.rows[0];
    question.upvotes = parseInt(countResult.rows[0].upvotes);
    
    return question;
  },
  
  /**
   * Mark a question as answered
   * @param {number} questionId - Question ID
   * @param {boolean} isAnswered - Whether the question has been answered
   * @returns {Promise} - Updated question
   */
  async updateAnsweredStatus(questionId, isAnswered) {
    const result = await db.query(
      'UPDATE questions SET is_answered = $1 WHERE id = $2 RETURNING *',
      [isAnswered, questionId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Question not found');
    }
    
    // Add upvote count to response
    const countResult = await db.query(
      'SELECT COUNT(*) as upvotes FROM question_upvotes WHERE question_id = $1',
      [questionId]
    );
    
    const question = result.rows[0];
    question.upvotes = parseInt(countResult.rows[0].upvotes);
    
    return question;
  },
  
  /**
   * Update Q&A session active status
   * @param {number} id - Q&A session ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - Updated Q&A session
   */
  async setSessionActive(id, isActive) {
    const result = await db.query(
      'UPDATE qa_sessions SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    return result.rows[0];
  },
  
  /**
   * Update Q&A session moderation setting
   * @param {number} id - Q&A session ID
   * @param {boolean} moderationEnabled - Whether moderation is enabled
   * @returns {Promise} - Updated Q&A session
   */
  async setModeration(id, moderationEnabled) {
    const result = await db.query(
      'UPDATE qa_sessions SET moderation_enabled = $1 WHERE id = $2 RETURNING *',
      [moderationEnabled, id]
    );
    
    return result.rows[0];
  },
  
  /**
   * Delete a Q&A session and related data
   * @param {number} id - Q&A session ID
   * @returns {Promise} - Success status
   */
  async deleteSession(id) {
    try {
      // Use a transaction for cascading deletion
      await db.query('BEGIN');
      
      // Get all question IDs in this session
      const questionIds = await db.query(
        'SELECT id FROM questions WHERE qa_session_id = $1',
        [id]
      );
      
      const ids = questionIds.rows.map(row => row.id);
      
      // Delete upvotes for all questions
      if (ids.length > 0) {
        await db.query(
          `DELETE FROM question_upvotes 
           WHERE question_id IN (${ids.join(',')})`,
        );
      }
      
      // Delete all questions
      await db.query('DELETE FROM questions WHERE qa_session_id = $1', [id]);
      
      // Delete the Q&A session
      const result = await db.query(
        'DELETE FROM qa_sessions WHERE id = $1 RETURNING id',
        [id]
      );
      
      await db.query('COMMIT');
      
      return result.rows.length > 0;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
};

module.exports = QA;