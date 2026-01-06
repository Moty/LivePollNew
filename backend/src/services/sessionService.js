/**
 * sessionService.js
 * Firestore-based persistence for presentation sessions & poll responses
 */
const { db, isInitialized } = require('../config/firebase');
const mockDataService = require('./mockDataService');

const COLLECTIONS = {
  PRESENTATIONS: 'presentations',
  SESSIONS: 'presentationSessions', // top-level collection
};

const shouldUseFirestore = () => isInitialized && !global.useMockData;

const docToObject = (doc) => ({ _id: doc.id, ...doc.data() });

/**
 * Create a new session document under presentationSessions
 * @param {string} presentationId
 * @param {string} sessionCode  - join code shown to participants
 */
async function createSession(presentationId, sessionCode) {
  if (!shouldUseFirestore()) {
    return mockDataService.createSession?.(presentationId, sessionCode);
  }
  const now = new Date().toISOString();
  const data = {
    presentationId,
    sessionCode,
    startedAt: now,
    endedAt: null,
  };
  const docRef = await db.collection(COLLECTIONS.SESSIONS).add(data);
  return { _id: docRef.id, ...data };
}

/**
 * Mark session ended
 */
async function endSession(sessionId) {
  if (!shouldUseFirestore()) return mockDataService.endSession?.(sessionId);
  const endedAt = new Date().toISOString();
  await db.collection(COLLECTIONS.SESSIONS).doc(sessionId).update({ endedAt });
  return endedAt;
}

/**
 * List sessions for a presentation (ordered desc)
 */
async function listSessions(presentationId) {
  if (!shouldUseFirestore()) return mockDataService.listSessions?.(presentationId);
  const snap = await db.collection(COLLECTIONS.SESSIONS)
    .where('presentationId', '==', presentationId)
    .orderBy('startedAt', 'desc')
    .get();
  const sessions = [];
  for (const doc of snap.docs) {
    sessions.push(docToObject(doc));
  }
  return sessions;
}

/**
 * Add poll response in subcollection responses of a session
 * @param {string} sessionId
 * @param {string} pollId
 * @param {number} optionIndex
 * @param {string} userId
 */
async function addPollResponse(sessionId, pollId, optionIndex, userId) {
  console.log(`[SESSION_SERVICE DEBUG] Adding poll response: sessionId=${sessionId}, pollId=${pollId}, optionIndex=${optionIndex}, userId=${userId}`);
  
  if (!shouldUseFirestore()) {
    console.log('[SESSION_SERVICE DEBUG] Using mock data service for addPollResponse');
    return mockDataService.addPollResponse?.(sessionId, pollId, optionIndex, userId);
  }
  
  try {
    // Validate inputs
    if (!sessionId) {
      console.error('[SESSION_SERVICE DEBUG] Missing sessionId for poll response');
      throw new Error('sessionId is required');
    }
    if (!pollId) {
      console.error('[SESSION_SERVICE DEBUG] Missing pollId for poll response');
      throw new Error('pollId is required');
    }
    if (optionIndex === undefined || optionIndex === null) {
      console.error('[SESSION_SERVICE DEBUG] Missing optionIndex for poll response');
      throw new Error('optionIndex is required');
    }
    
    const docRef = db.collection(COLLECTIONS.SESSIONS)
      .doc(sessionId)
      .collection('responses')
      .doc();
      
    const responseData = { 
      pollId, 
      optionIndex, 
      userId: userId || 'anonymous', 
      submittedAt: new Date().toISOString() 
    };
    
    console.log('[SESSION_SERVICE DEBUG] Saving response to Firestore:', responseData);
    await docRef.set(responseData);
    console.log(`[SESSION_SERVICE DEBUG] Successfully saved response with ID: ${docRef.id}`);
    return docRef.id; // Return the document ID for confirmation
  } catch (error) {
    console.error('[SESSION_SERVICE DEBUG] Error saving poll response:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Get aggregated poll results for an activity within session
 * returns array [{ optionIndex, votes }]
 */
async function getPollResults(sessionId, pollId) {
  console.log(`[SESSION_SERVICE DEBUG] Getting poll results: sessionId=${sessionId}, pollId=${pollId}`);
  
  if (!shouldUseFirestore()) {
    console.log('[SESSION_SERVICE DEBUG] Using mock data service for getPollResults');
    return mockDataService.getPollResults?.(sessionId, pollId);
  }
  
  try {
    // Validate inputs
    if (!sessionId) {
      console.error('[SESSION_SERVICE DEBUG] Missing sessionId for poll results');
      return [];
    }
    
    // Build query - if pollId provided, filter by it
    let query = db.collection(COLLECTIONS.SESSIONS)
      .doc(sessionId)
      .collection('responses');
      
    if (pollId) {
      console.log(`[SESSION_SERVICE DEBUG] Filtering results by pollId=${pollId}`);
      query = query.where('pollId', '==', pollId);
    } else {
      console.log('[SESSION_SERVICE DEBUG] Getting all poll results for session (no pollId filter)');
    }
    
    const snap = await query.get();
    
    console.log(`[SESSION_SERVICE DEBUG] Found ${snap.size} response documents`);
    
    // Track responses by poll ID if not filtered
    const countsByPoll = {};
    const counts = {};
    
    snap.forEach(doc => {
      const data = doc.data();
      const { pollId: respPollId, optionIndex } = data;
      
      // Skip records with missing data
      if (optionIndex === undefined || optionIndex === null) {
        console.warn(`[SESSION_SERVICE DEBUG] Response missing optionIndex: ${doc.id}`);
        return;
      }
      
      // Count this response
      counts[optionIndex] = (counts[optionIndex] || 0) + 1;
      
      // Track by poll ID if not filtered
      if (!pollId) {
        if (!countsByPoll[respPollId]) {
          countsByPoll[respPollId] = {};
        }
        countsByPoll[respPollId][optionIndex] = (countsByPoll[respPollId][optionIndex] || 0) + 1;
      }
    });
    
    // Convert counts to array format
    const results = Object.keys(counts).map(k => ({ 
      optionIndex: Number(k), 
      votes: counts[k] 
    }));
    
    console.log(`[SESSION_SERVICE DEBUG] Aggregated results: ${JSON.stringify(results)}`);
    
    // Also log per-poll counts if we weren't filtering
    if (!pollId && Object.keys(countsByPoll).length > 0) {
      console.log('[SESSION_SERVICE DEBUG] Results by poll:');
      Object.entries(countsByPoll).forEach(([pollId, pollCounts]) => {
        const pollResults = Object.keys(pollCounts).map(k => ({ 
          optionIndex: Number(k), 
          votes: pollCounts[k] 
        }));
        console.log(`[SESSION_SERVICE DEBUG]   Poll ${pollId}: ${JSON.stringify(pollResults)}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('[SESSION_SERVICE DEBUG] Error getting poll results:', error);
    return [];
  }
}

module.exports = {
  createSession,
  endSession,
  listSessions,
  addPollResponse,
  getPollResults,
};
