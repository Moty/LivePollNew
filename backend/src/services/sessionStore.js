/**
 * Session Store Service
 *
 * Centralized store for session data that can be accessed by both
 * the socket service and REST API routes for exports and analytics.
 */

const logger = require('../utils/logger');

// In-memory session storage (replace with Redis for production scaling)
const sessions = new Map();
const sessionCodes = new Map();

// Response storage for completed sessions (for export functionality)
const archivedResponses = new Map();

/**
 * Create a new session
 * @param {Object} sessionData - Session configuration
 * @returns {Object} - Created session
 */
const createSession = (sessionData) => {
  const {
    id,
    code,
    presentationId,
    title,
    description,
    presenterSocketId,
    presenterName
  } = sessionData;

  const session = {
    id,
    code,
    presentationId,
    title: title || 'Interactive Session',
    description: description || '',
    presenterSocketId,
    presenterName,
    createdAt: new Date().toISOString(),
    lastActive: Date.now(),
    participants: new Set(),
    participantCount: 0,
    activeActivity: null,
    responses: [],
    activityHistory: [],
    totalResponses: 0,
    status: 'active'
  };

  sessions.set(id, session);
  if (code) {
    sessionCodes.set(code, id);
  }

  logger.info(`Session created: ${id}`, { code, presentationId });
  return session;
};

/**
 * Get a session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session or null
 */
const getSession = (sessionId) => {
  return sessions.get(sessionId) || null;
};

/**
 * Get a session by code
 * @param {string} code - Session code
 * @returns {Object|null} - Session or null
 */
const getSessionByCode = (code) => {
  const sessionId = sessionCodes.get(code);
  return sessionId ? sessions.get(sessionId) : null;
};

/**
 * Get session by ID or code
 * @param {string} sessionId - Session ID (optional)
 * @param {string} sessionCode - Session code (optional)
 * @returns {Object|null} - Session or null
 */
const findSession = (sessionId, sessionCode) => {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }
  if (sessionCode && sessionCodes.has(sessionCode)) {
    const id = sessionCodes.get(sessionCode);
    return sessions.get(id) || null;
  }
  return null;
};

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated session or null
 */
const updateSession = (sessionId, updates) => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  Object.assign(session, updates, { lastActive: Date.now() });
  return session;
};

/**
 * Add a response to a session
 * @param {string} sessionId - Session ID
 * @param {Object} response - Response data
 */
const addResponse = (sessionId, response) => {
  const session = sessions.get(sessionId);
  if (!session) {
    logger.warn(`Cannot add response: session ${sessionId} not found`);
    return false;
  }

  const formattedResponse = {
    ...response,
    timestamp: response.timestamp || new Date().toISOString(),
    sessionId
  };

  session.responses.push(formattedResponse);
  session.totalResponses = (session.totalResponses || 0) + 1;
  session.lastActive = Date.now();

  return true;
};

/**
 * Get all responses for a session
 * @param {string} sessionId - Session ID
 * @returns {Array} - Array of responses
 */
const getSessionResponses = (sessionId) => {
  const session = sessions.get(sessionId);
  if (session) {
    return session.responses || [];
  }

  // Check archived responses
  return archivedResponses.get(sessionId) || [];
};

/**
 * Get responses filtered by activity
 * @param {string} sessionId - Session ID
 * @param {string} activityId - Activity ID
 * @returns {Array} - Filtered responses
 */
const getActivityResponses = (sessionId, activityId) => {
  const responses = getSessionResponses(sessionId);
  return responses.filter(r => r.activityId === activityId);
};

/**
 * End a session and archive its data
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Archived session data
 */
const endSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Archive responses before deleting
  archivedResponses.set(sessionId, {
    ...session,
    participants: Array.from(session.participants || []),
    endedAt: new Date().toISOString(),
    status: 'ended'
  });

  // Clean up session code mapping
  if (session.code) {
    sessionCodes.delete(session.code);
  }

  sessions.delete(sessionId);
  logger.info(`Session ended and archived: ${sessionId}`);

  return archivedResponses.get(sessionId);
};

/**
 * Get all active sessions
 * @returns {Array} - Array of active sessions
 */
const getActiveSessions = () => {
  return Array.from(sessions.values());
};

/**
 * Get session statistics
 * @param {string} sessionId - Session ID
 * @returns {Object} - Session statistics
 */
const getSessionStats = (sessionId) => {
  const session = sessions.get(sessionId) || archivedResponses.get(sessionId);
  if (!session) return null;

  const responses = session.responses || [];

  // Group responses by activity
  const byActivity = {};
  responses.forEach(r => {
    const actId = r.activityId || 'unknown';
    if (!byActivity[actId]) {
      byActivity[actId] = [];
    }
    byActivity[actId].push(r);
  });

  return {
    sessionId,
    totalResponses: responses.length,
    participantCount: session.participantCount ||
      (session.participants instanceof Set ? session.participants.size :
       Array.isArray(session.participants) ? session.participants.length : 0),
    activitiesWithResponses: Object.keys(byActivity).length,
    responsesByActivity: Object.entries(byActivity).map(([actId, resps]) => ({
      activityId: actId,
      responseCount: resps.length
    })),
    createdAt: session.createdAt,
    lastActive: session.lastActive,
    status: session.status || 'active'
  };
};

/**
 * Export session data in a structured format
 * @param {string} sessionId - Session ID
 * @returns {Object} - Exportable session data
 */
const exportSessionData = (sessionId) => {
  const session = sessions.get(sessionId) || archivedResponses.get(sessionId);
  if (!session) return null;

  return {
    session: {
      id: session.id,
      code: session.code,
      title: session.title,
      presentationId: session.presentationId,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      status: session.status
    },
    statistics: getSessionStats(sessionId),
    responses: (session.responses || []).map(r => ({
      activityId: r.activityId,
      participantId: r.participantId,
      userName: r.userName,
      responseData: r.responseData,
      timestamp: r.timestamp
    }))
  };
};

/**
 * Get responses for a presentation (across all sessions)
 * @param {string} presentationId - Presentation ID
 * @returns {Array} - All responses for the presentation
 */
const getPresentationResponses = (presentationId) => {
  const allResponses = [];

  // Check active sessions
  for (const session of sessions.values()) {
    if (session.presentationId === presentationId) {
      allResponses.push(...(session.responses || []).map(r => ({
        ...r,
        sessionId: session.id,
        sessionCode: session.code
      })));
    }
  }

  // Check archived sessions
  for (const [sessionId, session] of archivedResponses.entries()) {
    if (session.presentationId === presentationId) {
      allResponses.push(...(session.responses || []).map(r => ({
        ...r,
        sessionId,
        sessionCode: session.code
      })));
    }
  }

  return allResponses;
};

/**
 * Clean up old archived sessions (call periodically)
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 7 days)
 */
const cleanupArchivedSessions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of archivedResponses.entries()) {
    const endedAt = new Date(session.endedAt).getTime();
    if (now - endedAt > maxAgeMs) {
      archivedResponses.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} archived sessions`);
  }
};

// Export the session store
module.exports = {
  createSession,
  getSession,
  getSessionByCode,
  findSession,
  updateSession,
  addResponse,
  getSessionResponses,
  getActivityResponses,
  endSession,
  getActiveSessions,
  getSessionStats,
  exportSessionData,
  getPresentationResponses,
  cleanupArchivedSessions,
  // Expose the maps for direct access (needed by socket service for backward compatibility)
  sessions,
  sessionCodes
};
