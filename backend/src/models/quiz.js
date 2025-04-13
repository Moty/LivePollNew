const db = require('../config/db');

/**
 * Quiz Model
 * Handles database operations for quizzes, questions, and responses
 */
const Quiz = {
  /**
   * Create a new quiz
   * @param {Object} quiz - Quiz data
   * @param {string} quiz.sessionId - Session ID
   * @param {string} quiz.title - Quiz title
   * @param {Object[]} [quiz.questions] - Quiz questions (optional)
   * @returns {Promise} - Newly created quiz
   */
  async create(quiz) {
    // First, insert the quiz
    const quizResult = await db.query(
      `INSERT INTO quizzes (session_id, title, created_at, is_active)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [quiz.sessionId, quiz.title, false] // Default to inactive
    );
    
    const newQuiz = quizResult.rows[0];
    
    // If questions are provided, insert them
    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      for (const question of quiz.questions) {
        // Insert the question
        const questionResult = await db.query(
          `INSERT INTO quiz_questions (quiz_id, text, time_limit)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [
            newQuiz.id,
            question.text,
            question.timeLimit || 30 // Default 30 seconds if not specified
          ]
        );
        
        const questionId = questionResult.rows[0].id;
        
        // Insert options if available
        if (Array.isArray(question.options) && question.options.length > 0) {
          for (const option of question.options) {
            await db.query(
              `INSERT INTO quiz_options (question_id, text, is_correct)
               VALUES ($1, $2, $3)`,
              [questionId, option.text, option.isCorrect || false]
            );
          }
        }
      }
    }
    
    // Return the quiz with all data
    return this.getById(newQuiz.id);
  },
  
  /**
   * Get quiz by ID with all questions and options
   * @param {number} id - Quiz ID
   * @returns {Promise} - Quiz with questions and options
   */
  async getById(id) {
    // Fetch quiz
    const quizResult = await db.query(
      'SELECT * FROM quizzes WHERE id = $1',
      [id]
    );
    
    if (quizResult.rows.length === 0) {
      return null;
    }
    
    const quiz = quizResult.rows[0];
    
    // Fetch questions
    const questionsResult = await db.query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY id',
      [id]
    );
    
    quiz.questions = questionsResult.rows;
    
    // Fetch options for each question
    for (const question of quiz.questions) {
      const optionsResult = await db.query(
        'SELECT * FROM quiz_options WHERE question_id = $1 ORDER BY id',
        [question.id]
      );
      
      question.options = optionsResult.rows;
    }
    
    return quiz;
  },
  
  /**
   * Get quizzes by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Array of quizzes
   */
  async getBySession(sessionId) {
    // Fetch quizzes
    const quizzesResult = await db.query(
      'SELECT * FROM quizzes WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );
    
    const quizzes = quizzesResult.rows;
    
    // For each quiz, fetch questions count
    for (const quiz of quizzes) {
      const countResult = await db.query(
        'SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1',
        [quiz.id]
      );
      
      quiz.questionCount = parseInt(countResult.rows[0].count);
    }
    
    return quizzes;
  },
  
  /**
   * Get public quiz data (for participants)
   * This excludes correct answers
   * @param {number} id - Quiz ID
   * @returns {Promise} - Quiz without showing correct answers
   */
  async getPublicQuiz(id) {
    const quiz = await this.getById(id);
    
    if (!quiz) {
      return null;
    }
    
    // Remove correct answer information
    for (const question of quiz.questions) {
      for (const option of question.options) {
        delete option.is_correct;
      }
    }
    
    return quiz;
  },

  /**
   * Record a response to a quiz question
   * @param {Object} response - Response data
   * @param {number} response.questionId - Question ID
   * @param {number} response.optionId - Option ID (answer)
   * @param {string} response.userId - User ID
   * @param {number} response.timeSpent - Time spent in seconds (optional)
   * @returns {Promise} - Added response and whether it was correct
   */
  async recordAnswer(response) {
    // Check if the option is correct
    const optionResult = await db.query(
      'SELECT is_correct FROM quiz_options WHERE id = $1',
      [response.optionId]
    );
    
    if (optionResult.rows.length === 0) {
      throw new Error('Invalid option ID');
    }
    
    const isCorrect = optionResult.rows[0].is_correct;
    
    // Record the answer
    const result = await db.query(
      `INSERT INTO quiz_responses 
       (question_id, option_id, user_id, is_correct, time_spent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        response.questionId,
        response.optionId,
        response.userId,
        isCorrect,
        response.timeSpent || null
      ]
    );
    
    return { response: result.rows[0], isCorrect };
  },
  
  /**
   * Get quiz results
   * @param {number} quizId - Quiz ID
   * @returns {Promise} - Quiz results with statistics
   */
  async getResults(quizId) {
    const quiz = await this.getById(quizId);
    
    if (!quiz) {
      return null;
    }
    
    // For each question, get response statistics
    for (const question of quiz.questions) {
      // Get total responses
      const totalResult = await db.query(
        'SELECT COUNT(*) FROM quiz_responses WHERE question_id = $1',
        [question.id]
      );
      
      question.totalResponses = parseInt(totalResult.rows[0].count);
      
      // Get correct responses
      const correctResult = await db.query(
        'SELECT COUNT(*) FROM quiz_responses WHERE question_id = $1 AND is_correct = true',
        [question.id]
      );
      
      question.correctResponses = parseInt(correctResult.rows[0].count);
      question.correctPercentage = question.totalResponses > 0 
        ? Math.round((question.correctResponses / question.totalResponses) * 100) 
        : 0;
      
      // Get response breakdown by option
      const breakdownResult = await db.query(
        `SELECT o.id, o.text, COUNT(r.id) as count
         FROM quiz_options o
         LEFT JOIN quiz_responses r ON o.id = r.option_id
         WHERE o.question_id = $1
         GROUP BY o.id, o.text
         ORDER BY o.id`,
        [question.id]
      );
      
      question.responsesBreakdown = breakdownResult.rows;
    }
    
    // Get leaderboard of top performers
    const leaderboardResult = await db.query(
      `SELECT user_id, 
              COUNT(*) as total_answers,
              SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers
       FROM quiz_responses
       WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = $1)
       GROUP BY user_id
       ORDER BY correct_answers DESC, total_answers ASC
       LIMIT 10`,
      [quizId]
    );
    
    quiz.leaderboard = leaderboardResult.rows;
    
    return quiz;
  },
  
  /**
   * Update quiz active status
   * @param {number} id - Quiz ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - Updated quiz
   */
  async setActive(id, isActive) {
    const result = await db.query(
      'UPDATE quizzes SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    return result.rows[0];
  },
  
  /**
   * Delete a quiz and its related data
   * @param {number} id - Quiz ID
   * @returns {Promise} - Success status
   */
  async delete(id) {
    try {
      // Use a transaction to ensure all deletions succeed or fail together
      await db.query('BEGIN');
      
      // Get all question IDs for this quiz
      const questionResult = await db.query(
        'SELECT id FROM quiz_questions WHERE quiz_id = $1',
        [id]
      );
      
      const questionIds = questionResult.rows.map(row => row.id);
      
      // Delete responses for all questions
      if (questionIds.length > 0) {
        await db.query(
          `DELETE FROM quiz_responses 
           WHERE question_id IN (${questionIds.join(',')})`,
        );
      }
      
      // Delete options for all questions
      if (questionIds.length > 0) {
        await db.query(
          `DELETE FROM quiz_options 
           WHERE question_id IN (${questionIds.join(',')})`,
        );
      }
      
      // Delete questions
      await db.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);
      
      // Delete the quiz
      const result = await db.query(
        'DELETE FROM quizzes WHERE id = $1 RETURNING id',
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

module.exports = Quiz;