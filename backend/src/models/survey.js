const db = require('../config/db');

/**
 * Survey Model
 * Handles database operations for multi-question surveys
 */
const Survey = {
  /**
   * Create a new survey
   * @param {Object} survey - Survey data
   * @param {string} survey.sessionId - Session ID
   * @param {string} survey.title - Survey title
   * @param {string} [survey.description] - Survey description
   * @returns {Promise} - Newly created survey
   */
  async create(survey) {
    const result = await db.query(
      `INSERT INTO surveys (session_id, title, description, created_at, is_active)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [survey.sessionId, survey.title, survey.description || null, false] // Default inactive
    );
    
    return result.rows[0];
  },
  
  /**
   * Add a question to a survey
   * @param {Object} question - Question data
   * @param {number} question.surveyId - Survey ID
   * @param {string} question.text - Question text
   * @param {string} question.type - Question type (multiple_choice, rating, text)
   * @param {number} question.order - Question order in survey
   * @param {boolean} question.required - Whether the question is required
   * @param {Object[]} [question.options] - Question options for multiple choice
   * @returns {Promise} - Added question
   */
  async addQuestion(question) {
    // Insert question
    const questionResult = await db.query(
      `INSERT INTO survey_questions 
       (survey_id, text, type, question_order, required)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        question.surveyId, 
        question.text, 
        question.type, 
        question.order || 0,
        question.required || false
      ]
    );
    
    const newQuestion = questionResult.rows[0];
    
    // If multiple_choice, add options
    if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
      const options = [];
      
      for (let i = 0; i < question.options.length; i++) {
        const optionResult = await db.query(
          `INSERT INTO survey_options (question_id, text, option_order)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [newQuestion.id, question.options[i].text, i]
        );
        
        options.push(optionResult.rows[0]);
      }
      
      newQuestion.options = options;
    }
    
    return newQuestion;
  },
  
  /**
   * Get survey by ID with all questions and options
   * @param {number} id - Survey ID
   * @returns {Promise} - Survey with questions and options
   */
  async getById(id) {
    // Get survey
    const surveyResult = await db.query(
      'SELECT * FROM surveys WHERE id = $1',
      [id]
    );
    
    if (surveyResult.rows.length === 0) {
      return null;
    }
    
    const survey = surveyResult.rows[0];
    
    // Get questions
    const questionsResult = await db.query(
      `SELECT * FROM survey_questions 
       WHERE survey_id = $1 
       ORDER BY question_order, id`,
      [id]
    );
    
    survey.questions = questionsResult.rows;
    
    // For each question, get options if applicable
    for (const question of survey.questions) {
      if (question.type === 'multiple_choice') {
        const optionsResult = await db.query(
          `SELECT * FROM survey_options 
           WHERE question_id = $1 
           ORDER BY option_order, id`,
          [question.id]
        );
        
        question.options = optionsResult.rows;
      }
    }
    
    return survey;
  },
  
  /**
   * Get surveys by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} - Array of surveys
   */
  async getBySession(sessionId) {
    const surveysResult = await db.query(
      'SELECT * FROM surveys WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );
    
    const surveys = surveysResult.rows;
    
    // For each survey, get question count
    for (const survey of surveys) {
      const countResult = await db.query(
        'SELECT COUNT(*) FROM survey_questions WHERE survey_id = $1',
        [survey.id]
      );
      
      survey.questionCount = parseInt(countResult.rows[0].count);
    }
    
    return surveys;
  },
  
  /**
   * Submit a response to the entire survey
   * @param {Object} submission - Submission data
   * @param {number} submission.surveyId - Survey ID
   * @param {string} submission.userId - User ID
   * @param {Object[]} submission.responses - Array of question responses
   * @returns {Promise} - Added submission
   */
  async submitResponse(submission) {
    try {
      await db.query('BEGIN');
      
      // First, create a submission record
      const submissionResult = await db.query(
        `INSERT INTO survey_submissions (survey_id, user_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [submission.surveyId, submission.userId]
      );
      
      const submissionId = submissionResult.rows[0].id;
      
      // Then insert each question response
      if (Array.isArray(submission.responses)) {
        for (const response of submission.responses) {
          await db.query(
            `INSERT INTO survey_responses 
             (submission_id, question_id, option_id, rating_value, text_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              submissionId,
              response.questionId,
              response.optionId || null,
              response.rating || null,
              response.text || null
            ]
          );
        }
      }
      
      await db.query('COMMIT');
      
      return { submissionId, surveyId: submission.surveyId, userId: submission.userId };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },
  
  /**
   * Get survey results
   * @param {number} surveyId - Survey ID
   * @returns {Promise} - Survey results with statistics
   */
  async getResults(surveyId) {
    const survey = await this.getById(surveyId);
    
    if (!survey) {
      return null;
    }
    
    // Get submission count
    const submissionCountResult = await db.query(
      'SELECT COUNT(DISTINCT user_id) FROM survey_submissions WHERE survey_id = $1',
      [surveyId]
    );
    
    survey.responseCount = parseInt(submissionCountResult.rows[0].count);
    
    // For each question, get response statistics
    for (const question of survey.questions) {
      const questionId = question.id;
      
      if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
        // For multiple choice, count per option
        for (const option of question.options) {
          const countResult = await db.query(
            `SELECT COUNT(*) FROM survey_responses 
             WHERE question_id = $1 AND option_id = $2`,
            [questionId, option.id]
          );
          
          option.count = parseInt(countResult.rows[0].count);
          
          // Calculate percentage
          option.percentage = survey.responseCount > 0 
            ? Math.round((option.count / survey.responseCount) * 100) 
            : 0;
        }
      } else if (question.type === 'rating') {
        // For rating questions, calculate average and distribution
        const avgResult = await db.query(
          `SELECT AVG(rating_value) as average 
           FROM survey_responses
           WHERE question_id = $1 AND rating_value IS NOT NULL`,
          [questionId]
        );
        
        question.averageRating = avgResult.rows[0].average || 0;
        
        // Get distribution
        const distributionResult = await db.query(
          `SELECT rating_value, COUNT(*) as count
           FROM survey_responses
           WHERE question_id = $1 AND rating_value IS NOT NULL
           GROUP BY rating_value
           ORDER BY rating_value`,
          [questionId]
        );
        
        question.ratingDistribution = distributionResult.rows;
      } else if (question.type === 'text') {
        // For text questions, get all responses
        const textResult = await db.query(
          `SELECT text_value 
           FROM survey_responses
           WHERE question_id = $1 AND text_value IS NOT NULL
           ORDER BY id DESC`,
          [questionId]
        );
        
        question.textResponses = textResult.rows.map(row => row.text_value);
      }
    }
    
    return survey;
  },
  
  /**
   * Export survey data (for CSV/Excel export)
   * @param {number} surveyId - Survey ID
   * @returns {Promise} - Array of response objects with flattened structure
   */
  async exportData(surveyId) {
    const survey = await this.getById(surveyId);
    
    if (!survey) {
      return null;
    }
    
    // Get all submissions
    const submissionsResult = await db.query(
      `SELECT ss.id, ss.user_id, ss.created_at
       FROM survey_submissions ss
       WHERE ss.survey_id = $1
       ORDER BY ss.created_at`,
      [surveyId]
    );
    
    const submissions = submissionsResult.rows;
    const exportData = [];
    
    // For each submission, create a response object with flattened question responses
    for (const submission of submissions) {
      const responseData = {
        submissionId: submission.id,
        userId: submission.user_id,
        submittedAt: submission.created_at
      };
      
      // Get all responses for this submission
      const responsesResult = await db.query(
        `SELECT sr.question_id, sq.text as question_text, sq.type,
                sr.option_id, so.text as option_text,
                sr.rating_value, sr.text_value
         FROM survey_responses sr
         JOIN survey_questions sq ON sr.question_id = sq.id
         LEFT JOIN survey_options so ON sr.option_id = so.id
         WHERE sr.submission_id = $1
         ORDER BY sq.question_order, sq.id`,
        [submission.id]
      );
      
      const responses = responsesResult.rows;
      
      // Flatten responses
      for (const response of responses) {
        const questionKey = `question_${response.question_id}`;
        
        if (response.type === 'multiple_choice') {
          responseData[questionKey] = response.option_text;
        } else if (response.type === 'rating') {
          responseData[questionKey] = response.rating_value;
        } else {
          responseData[questionKey] = response.text_value;
        }
      }
      
      exportData.push(responseData);
    }
    
    return { survey, exportData };
  },
  
  /**
   * Update survey is_active status
   * @param {number} id - Survey ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - Updated survey
   */
  async setActive(id, isActive) {
    const result = await db.query(
      'UPDATE surveys SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    return result.rows[0];
  },
  
  /**
   * Delete a survey and all related data
   * @param {number} id - Survey ID
   * @returns {Promise} - Success status
   */
  async delete(id) {
    try {
      await db.query('BEGIN');
      
      // Get question IDs
      const questionsResult = await db.query(
        'SELECT id FROM survey_questions WHERE survey_id = $1',
        [id]
      );
      
      const questionIds = questionsResult.rows.map(row => row.id);
      
      // Get submission IDs
      const submissionsResult = await db.query(
        'SELECT id FROM survey_submissions WHERE survey_id = $1',
        [id]
      );
      
      const submissionIds = submissionsResult.rows.map(row => row.id);
      
      // Delete responses for all submissions
      if (submissionIds.length > 0) {
        await db.query(
          `DELETE FROM survey_responses 
           WHERE submission_id IN (${submissionIds.join(',')})`,
        );
      }
      
      // Delete all submissions
      await db.query('DELETE FROM survey_submissions WHERE survey_id = $1', [id]);
      
      // Delete options for all questions
      if (questionIds.length > 0) {
        await db.query(
          `DELETE FROM survey_options 
           WHERE question_id IN (${questionIds.join(',')})`,
        );
      }
      
      // Delete all questions
      await db.query('DELETE FROM survey_questions WHERE survey_id = $1', [id]);
      
      // Delete the survey
      const result = await db.query(
        'DELETE FROM surveys WHERE id = $1 RETURNING id',
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

module.exports = Survey;