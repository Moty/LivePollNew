const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Session Model
 * Handles CRUD for presentation sessions and aggregated results retrieval
 */
class Session {
  /**
   * Create a new session for a presentation
   * @param {string} presentationId - UUID of the presentation
   * @param {string} [sessionCode] - unique code used by participants (optional)
   * @returns {Promise<object>} - created session { id, presentation_id, session_code, started_at }
   */
  static async create(presentationId, sessionCode) {
    const code = sessionCode || uuidv4();
    const query = `
      INSERT INTO presentation_sessions (presentation_id, session_code, started_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const { rows } = await db.query(query, [presentationId, code]);
    return rows[0];
  }

  /**
   * End/close a session (sets ended_at)
   * @param {number} sessionId
   */
  static async end(sessionId) {
    const query = `UPDATE presentation_sessions SET ended_at = NOW() WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [sessionId]);
    return rows[0];
  }

  /**
   * List sessions for a presentation
   * @param {string} presentationId
   */
  static async listByPresentation(presentationId) {
    const query = `
      SELECT s.*, COUNT(r.*) AS total_responses
      FROM presentation_sessions s
      LEFT JOIN session_poll_responses r ON r.session_id = s.id
      WHERE s.presentation_id = $1
      GROUP BY s.id
      ORDER BY s.started_at DESC;
    `;
    const { rows } = await db.query(query, [presentationId]);
    return rows;
  }

  /**
   * Add poll response under session
   * @param {number} sessionId
   * @param {string} pollId
   * @param {number} optionId
   * @param {string} userId
   */
  static async addPollResponse(sessionId, pollId, optionId, userId) {
    const query = `
      INSERT INTO session_poll_responses (session_id, poll_id, option_id, user_id, submitted_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    await db.query(query, [sessionId, pollId, optionId, userId]);
  }

  /**
   * Aggregate poll results for a session (all activities or specific activity)
   * @param {number} sessionId
   * @param {string} [pollId]
   */
  static async getPollResults(sessionId, pollId) {
    const query = `
      SELECT option_id, COUNT(*) AS votes
      FROM session_poll_responses
      WHERE session_id = $1 ${pollId ? 'AND poll_id = $2' : ''}
      GROUP BY option_id
      ORDER BY option_id;
    `;
    const params = pollId ? [sessionId, pollId] : [sessionId];
    const { rows } = await db.query(query, params);
    return rows;
  }
}

module.exports = Session;
