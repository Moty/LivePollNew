/**
 * Socket.IO service for handling real-time communication
 * Manages connections and events for features like word clouds, polls, quizzes, Q&A
 */

const logger = require('../utils/logger');
const {
  generateUniqueSessionCode,
  isValidSessionCode,
  SocketRateLimiter,
  validateSocketInput
} = require('../utils/sessionUtils');

module.exports = (io) => {
  // Track active sessions
  const activeSessions = new Map();

  // Track connected clients
  const connectedClients = new Map();

  // Session codes map (for easy lookup by code)
  const sessionCodes = new Map();

  // Keep a history of recent sessions for debugging (bounded)
  const recentSessions = [];
  const MAX_RECENT_SESSIONS = 100;

  // Rate limiters for different event types
  const rateLimiters = {
    connection: new SocketRateLimiter({ windowMs: 60000, maxRequests: 30 }),
    sessionJoin: new SocketRateLimiter({ windowMs: 60000, maxRequests: 10 }),
    activityResponse: new SocketRateLimiter({ windowMs: 10000, maxRequests: 20 }),
    general: new SocketRateLimiter({ windowMs: 60000, maxRequests: 100 })
  };

  logger.info('Socket.IO service initialized');

  // Generate a secure session code
  const generateSessionCode = () => {
    const code = generateUniqueSessionCode(sessionCodes);
    if (!code) {
      // Fallback to timestamp-based code if all else fails
      return Date.now().toString(36).toUpperCase().slice(-8);
    }
    return code;
  };

  // Helper function to clean up inactive sessions
  const cleanupInactiveSessions = () => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of activeSessions.entries()) {
      // Use lastActive instead of lastActivity for consistency
      const lastActive = session.lastActive || session.lastActivity || session.createdAt;
      if (now - lastActive > 24 * 60 * 60 * 1000) { // 24 hours
        // Also clean up the session code
        if (session.code) {
          sessionCodes.delete(session.code);
        }
        activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} inactive sessions`);
    }
  };

  // Run cleanup every hour
  const cleanupInterval = setInterval(cleanupInactiveSessions, 60 * 60 * 1000);

  // Cleanup on module unload
  process.on('beforeExit', () => {
    clearInterval(cleanupInterval);
    Object.values(rateLimiters).forEach(limiter => limiter.destroy());
  });
  
  // Helper function to find a session by ID or code
  const findSessionByIdOrCode = (sessionId, sessionCode) => {
    if (sessionId && activeSessions.has(sessionId)) {
      return activeSessions.get(sessionId);
    }
    
    if (sessionCode && sessionCodes.has(sessionCode)) {
      const id = sessionCodes.get(sessionCode);
      if (id && activeSessions.has(id)) {
        return activeSessions.get(id);
      }
    }
    
    return null;
  };
  
  // Socket.IO connection handling
  io.on('connection', socket => {
    try {
      const { presentationId, role, sessionCode } = socket.handshake.query;
      const clientIp = socket.handshake.address;

      // Rate limit connections per IP
      const connectionCheck = rateLimiters.connection.check(clientIp, 'connection');
      if (!connectionCheck.allowed) {
        logger.warn(`Rate limit exceeded for connection from ${clientIp}`);
        socket.emit('session-error', {
          code: 'RATE_LIMITED',
          message: 'Too many connection attempts. Please try again later.'
        });
        socket.disconnect(true);
        return;
      }

      logger.debug(`New client connected: ${socket.id}`, {
        ip: clientIp,
        presentationId,
        role,
        sessionCode
      });

      socket.join('global'); // All connected clients join this room

      // Connection credentials/info for reconnection
      const socketInfo = {
        id: socket.id,
        presentationId,
        sessionCode,
        role: role || 'viewer',
        connectedAt: Date.now(),
        ip: clientIp
      };

      // Track the client
      connectedClients.set(socket.id, socketInfo);

      // Keep a bounded log of recent sessions for debugging
      if (recentSessions.length >= MAX_RECENT_SESSIONS) {
        recentSessions.shift(); // Remove oldest
      }
      
      // If the client is a participant and we have a sessionCode, try to auto-join
      if (role === 'participant' && sessionCode) {
        console.log(`Auto-joining participant ${socket.id} to session ${sessionCode}`);
        
        // Fix lookup by code: Check the sessionCodes map first before trying direct access
        let session = null;
        let sessionId = null;
        
        // First, check if the code is in our sessionCodes map
        if (sessionCodes.has(sessionCode)) {
          sessionId = sessionCodes.get(sessionCode);
          console.log(`Found sessionId ${sessionId} for code ${sessionCode} in the sessionCodes map`);
          session = activeSessions.get(sessionId);
        }
        
        // If not found in map, try a direct lookup (backward compatibility)
        if (!session) {
          const fullSessionId = sessionCode.startsWith('session_') ? sessionCode : sessionCodes.get(sessionCode);
          session = activeSessions.get(fullSessionId);
          sessionId = fullSessionId;
        }
        
        if (session) {
          console.log(`Found session ${sessionId} for auto-join with ${session.participants ? session.participants.size : 0} existing participants`);
          
          // Join the session room
          socket.join(sessionId);
          
          // Make sure participants is initialized as a Map or Set
          if (!session.participants) {
            console.log(`Initializing participants collection for session ${sessionId}`);
            session.participants = new Set();
          }
          
          // Add participant to the session
          socket.data = { 
            userId: socket.id, 
            userName: 'Anonymous',
            joinedAt: Date.now()
          };
          
          // Track the participant in the session
          session.participants.add(socket.id);
          
          // Update the count and log the change
          const prevCount = session.participantCount || 0;
          session.participantCount = session.participants.size;
          console.log(`Updated participant count for session ${sessionId}: ${prevCount} -> ${session.participantCount}`);
          
          session.lastActive = Date.now();
          
          // Create session info to send to the participant
          const sessionInfo = {
            id: sessionId,
            sessionId: sessionId,
            code: session.code,
            title: session.title || 'Interactive Session',
            activeActivity: session.activeActivity,
            participantCount: session.participantCount,
            joinedAt: new Date().toISOString()
          };
          
          // Send session information to the participant
          socket.emit('session-info', sessionInfo);
          
          // Notify the participant of the current active activity, if any
          if (session.activeActivity) {
            console.log('Sending active activity to auto-joined participant:', session.activeActivity);
            // Send with all possible event names and formats for maximum compatibility
            socket.emit('activity-started', { activity: session.activeActivity });
            socket.emit('activity-started', session.activeActivity);
            
            socket.emit('update-activity', { activity: session.activeActivity });
            socket.emit('update-activity', session.activeActivity);
            
            socket.emit('start-activity', { activity: session.activeActivity });
            socket.emit('start-activity', session.activeActivity);
          }
          
          // Notify the presenter of the new participant
          const presenterSocket = io.sockets.sockets.get(session.presenterSocketId);
          if (presenterSocket) {
            console.log(`Notifying presenter ${session.presenterSocketId} of new participant ${socket.id}`);
            presenterSocket.emit('participant-joined', {
              participantId: socket.id,
              participantCount: session.participantCount,
              userName: socket.data.userName || 'Anonymous'
            });
          } else {
            console.log(`Presenter socket ${session.presenterSocketId} not found for notification`);
          }
          
          console.log(`Auto-joined participant ${socket.id} to session ${sessionId} (current count: ${session.participantCount})`);
        } else {
          console.log(`Session ${sessionCode} not found for auto-joining. Available sessions:`, 
            Array.from(activeSessions.keys()));
          console.log(`Available codes in sessionCodes map:`, 
            Array.from(sessionCodes.entries()));
        }
      }
      
      // Handle create-session event with extensive error handling
      socket.on('create-session', (data, callback) => {
        try {
          console.log(`Create session request from ${socket.id} for presentation ${data.presentationId}`);
          
          if (!data.presentationId) {
            console.error(`Missing presentationId in request from ${socket.id}`);
            socket.emit('session-error', {
              code: 'INVALID_PRESENTATION',
              message: 'Presentation ID is required to create a session'
            });
            return;
          }
          
          try {
            // Generate a new session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Generate a unique 6-digit session code
            let sessionCode;
            let attempts = 0;
            
            do {
              sessionCode = generateSessionCode();
              attempts++;
              
              if (attempts > 10) {
                console.error(`Failed to generate unique session code after ${attempts} attempts`);
                
                socket.emit('session-error', {
                  code: 'CODE_GENERATION_FAILED',
                  message: 'Failed to generate a unique session code'
                });
                return;
              }
            } while (sessionCodes.has(sessionCode));
            
            // Get the client's name (fallback to socket ID if not provided)
            const presenterName = data.presenterName || `Presenter_${socket.id.substr(0, 6)}`;
            
            // Get a shorter display code
            let code = sessionCode;
            
            // Create new session object
            const session = {
              id: sessionId,
              code: code,
              presentationId: data.presentationId,
              title: data.title || 'Interactive Session',
              description: data.description || '',
              presenterSocketId: socket.id,
              presenterName,
              createdAt: new Date().toISOString(),
              lastActive: Date.now(),
              participants: new Set(),
              participantCount: 0,
              activeActivity: null,
              responses: [],
              totalResponses: 0
            };
            
            console.log(`Creating new session ${sessionId} for presentation ${data.presentationId} by ${socket.id}`);
            
            // Store session in active sessions
            activeSessions.set(sessionId, session);
            
            // Store session code for easy lookup with both formats
            sessionCodes.set(code, sessionId);
            
            // Also store with the display code for cross-compatibility
            if (code !== sessionCode) {
              sessionCodes.set(sessionCode, sessionId);
            }
            
            console.log(`Added session codes to lookup map: "${code}" -> "${sessionId}" and "${sessionCode}" -> "${sessionId}"`);
            console.log(`sessionCodes map now contains ${sessionCodes.size} entries`);
            
            // Add to recent sessions for history
            recentSessions.push({
              id: sessionId,
              code: sessionCode,
              createdAt: session.createdAt,
              presenterName: session.presenterName
            });
            
            // Join the session room
            socket.join(sessionId);
            
            // Notify the client
            socket.emit('session-created', {
              sessionId,
              id: sessionId,
              code,
              title: data.title || 'Interactive Session',
              message: 'Session created successfully'
            });
            
            console.log(`Presenter ${socket.id} created session ${sessionId} for presentation ${data.presentationId} successfully`);
          } catch (err) {
            console.error(`Error creating session: ${err.message}`);
            socket.emit('session-error', {
              code: 'INTERNAL_ERROR',
              message: 'Internal server error while creating session'
            });
          }
        } catch (error) {
          console.error(`Error handling create-session from ${socket.id}:`, error);
          socket.emit('session-error', {
            code: 'CREATE_FAILED',
            message: 'Failed to create session: ' + (error.message || 'Unknown error')
          });
        }
      });
      
      // Handle start-activity event with extensive error handling
      socket.on('start-activity', async (data, callback) => {
        const { sessionId, sessionCode, activity, activityId } = data;
        console.log(`Received start-activity for session ${sessionId || sessionCode}:`, data);
        
        try {
          // Find the session by ID or code
          const session = findSessionByIdOrCode(sessionId, sessionCode);
          
          if (!session) {
            console.error(`Session ${sessionId || sessionCode} not found for activity start`);
            console.log('Available sessions:', Array.from(activeSessions.keys()));
            console.log('Available sessionCodes:', Array.from(sessionCodes.entries()));
            if (callback) callback({ error: 'Session not found' });
            return;
          }
          
          console.log(`Found session for activity start: ${session.id}`);
          
          // Determine the activity data to use - could be in activity field or directly in data
          const activityData = activity || (data.type ? data : null);
          
          if (!activityData) {
            console.error('No valid activity data found in request');
            if (callback) callback({ error: 'Invalid activity data' });
            return;
          }
          
          // Ensure activity has all required fields
          const normalizedActivity = {
            ...activityData,
            _id: activityData._id || activityData.id || activityId || `activity_${Date.now()}`,
            type: activityData.type || 'unknown',
            title: activityData.title || 'Untitled Activity',
            startedAt: activityData.startedAt || new Date().toISOString(),
            options: activityData.options || [],
            responses: activityData.responses || []
          };
          
          // Store the active activity in the session
          session.activeActivity = normalizedActivity;
          session.lastActive = Date.now();
          
          // Create a room name that's definitely correct for this session
          const roomName = session.id;
          
          // Count participants for logging
          const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
          console.log(`Broadcasting activity to room: ${roomName} with ${roomSize} participants`);
          
          // Send to ALL participants in the room (including sender for receipt confirmation)
          io.in(roomName).emit('activity-started', { activity: normalizedActivity });
          io.in(roomName).emit('update-activity', { activity: normalizedActivity });
          io.in(roomName).emit('start-activity', { activity: normalizedActivity });
          
          console.log(`Activity started broadcast to session ${session.id}`);
          
          // Also log room sizes for debugging
          console.log('Current room sizes:');
          for (const [roomId, room] of io.sockets.adapter.rooms.entries()) {
            if (!roomId.includes('#') && !roomId.includes('/')) {
              console.log(`Room ${roomId}: ${room.size} connections`);
            }
          }
          
          if (callback) callback({ success: true });
        } catch (error) {
          console.error('Error handling start-activity event:', error);
          if (callback) callback({ error: error.message || 'Error starting activity' });
        }
      });
      
      // Handle legacy format (update-activity)
      socket.on('update-activity', async (data, callback) => {
        const { sessionId, sessionCode, activity } = data;
        console.log(`Received update-activity for session ${sessionId || sessionCode}:`, activity);
        
        try {
          // Find the session by ID or code
          const session = findSessionByIdOrCode(sessionId, sessionCode);
      
          if (!session) {
            console.error(`Session ${sessionId || sessionCode} not found for activity update`);
            if (callback) callback({ error: 'Session not found' });
            return;
          }
          
          // Store the active activity in the session
          session.activeActivity = activity;
          
          // Broadcast to all participants in the session using multiple event names for compatibility
          socket.to(session.id).emit('activity-started', { activity });
          socket.to(session.id).emit('update-activity', { activity });
          socket.to(session.id).emit('start-activity', { activity });
          
          console.log(`Activity update broadcast to session ${session.id}`);
          
          if (callback) callback({ success: true });
        } catch (error) {
          console.error('Error handling update-activity event:', error);
          if (callback) callback({ error: error.message || 'Error updating activity' });
        }
      });
      
      // Handle another legacy format (activity-started)
      socket.on('activity-started', async (data, callback) => {
        const { sessionId, sessionCode, activity } = data;
        console.log(`Received activity-started for session ${sessionId || sessionCode}:`, activity);
        
        try {
          // Find the session by ID or code
          const session = findSessionByIdOrCode(sessionId, sessionCode);
          
          if (!session) {
            console.error(`Session ${sessionId || sessionCode} not found for activity-started`);
            if (callback) callback({ error: 'Session not found' });
            return;
          }
          
          // Store the active activity in the session
          session.activeActivity = activity;
          
          // Broadcast to all participants in the session using multiple event names for compatibility
          socket.to(session.id).emit('activity-started', { activity });
          socket.to(session.id).emit('update-activity', { activity });
          socket.to(session.id).emit('start-activity', { activity });
          
          console.log(`Activity started broadcast to session ${session.id}`);
          
          if (callback) callback({ success: true });
        } catch (error) {
          console.error('Error handling activity-started event:', error);
          if (callback) callback({ error: error.message || 'Error starting activity' });
        }
      });
      
      // Handle session join event (from participants)
      socket.on('join-session', (data, callback) => {
        try {
          const { sessionCode, name, role } = data;
          
          if (!sessionCode) {
            socket.emit('session-error', {
              code: 'INVALID_SESSION_CODE',
              message: 'Session code is required to join a session'
            });
            return;
          }
          
          console.log(`Join session request from ${socket.id} for code ${sessionCode}`);
          
          // Find session by code
          let session = null;
          let sessionId = null;
          
          if (sessionCodes.has(sessionCode)) {
            sessionId = sessionCodes.get(sessionCode);
            session = activeSessions.get(sessionId);
            console.log(`Found session ${sessionId} for join request with code ${sessionCode}`);
          }
          
          if (!session) {
            console.error(`Session ${sessionCode} not found for join request`);
            console.log('Available sessionCodes:', Array.from(sessionCodes.entries()));
            console.log('Available sessions:', Array.from(activeSessions.keys()));
            
            socket.emit('session-error', {
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found'
            });
            return;
          }
          
          console.log(`Found session ${session.id} for join request with code ${sessionCode}`);
          
          // Add client to the session room
          socket.join(session.id);
          
          // Initialize participants Set if it doesn't exist
          if (!session.participants) {
            console.log(`Initializing participants collection for session ${session.id} as a Set`);
            session.participants = new Set();
          } else if (!(session.participants instanceof Set)) {
            // If it's not a Set, convert it to a Set
            console.log(`Converting participants collection to a Set for session ${session.id}`);
            const oldParticipants = session.participants;
            session.participants = new Set();
            
            // If it was a Map, add values from the old Map
            if (oldParticipants instanceof Map) {
              for (const [_, participant] of oldParticipants) {
                if (participant && participant.socketId) {
                  session.participants.add(participant.socketId);
                }
              }
            }
          }
          
          // Add participant to the session directly by socket ID
          session.participants.add(socket.id);
          
          // Update participant count
          const prevCount = session.participantCount || 0;
          session.participantCount = session.participants.size;
          session.lastActive = Date.now();
          
          console.log(`Participant count updated: ${prevCount} -> ${session.participantCount} in session ${session.id}`);
          
          // Store session info in client info
          const clientInfo = connectedClients.get(socket.id) || {};
          clientInfo.sessionId = session.id;
          clientInfo.sessionCode = session.code;
          clientInfo.role = role || 'participant';
          connectedClients.set(socket.id, clientInfo);
          
          // Store participant data in socket.data
          socket.data = {
            userId: socket.id,
            userName: name || 'Anonymous',
            joinedAt: Date.now(),
            sessionId: session.id,
            sessionCode
          };
          
          // Notify presenter about new participant
          if (session.presenterSocketId) {
            console.log(`Notifying presenter ${session.presenterSocketId} about new participant ${socket.id}`);
            io.to(session.presenterSocketId).emit('participant-joined', {
              participant: socket.data,
              participantCount: session.participantCount
            });
          }
          
          // Send session info to the participant with active activity if any
          const sessionInfo = {
            id: session.id,
            code: session.code,
            title: session.title || 'Interactive Session',
            presenterName: session.presenterName || 'Presenter',
            activeActivity: session.activeActivity || null,
            participantCount: session.participantCount,
            joinedAt: new Date().toISOString()
          };
          
          console.log(`Participant ${socket.id} joined session ${session.id} with code ${session.code}`);
          console.log('Sending session info to participant:', sessionInfo);
          
          // Send session info to the participant
          socket.emit('session-info', sessionInfo);
          
          // If there's an active activity, also send it using activity-started event for compatibility
          if (session.activeActivity) {
            console.log('Sending active activity to new participant:', session.activeActivity);
            socket.emit('activity-started', { activity: session.activeActivity });
            socket.emit('update-activity', { activity: session.activeActivity });
            socket.emit('start-activity', { activity: session.activeActivity });
          }
          
          // Send success acknowledgment if callback exists
          if (callback) {
            callback({ success: true });
          }
        } catch (error) {
          console.error('Error handling join session:', error);
          if (callback) {
            callback({ error: error.message || 'Error joining session' });
          } else {
            socket.emit('session-error', {
              code: 'JOIN_FAILED',
              message: 'Failed to join session: ' + (error.message || 'Unknown error')
            });
          }
        }
      });
      
      // Handle rejoin-session event
      socket.on('rejoin-session', (data) => {
        try {
          const { sessionCode, isPresenter } = data;
          // Use either the data from the event or from the socket query
          const code = sessionCode || socket.handshake.query.sessionCode;
          
          console.log(`Rejoin session request from ${socket.id} for code ${code}`);
          
          if (!code) {
            socket.emit('session-error', {
              code: 'INVALID_SESSION_CODE',
              message: 'Session code is required to rejoin a session'
            });
            return;
          }
          
          // Find the session by code
          const sessionId = `session_${code}`;
          const session = activeSessions.get(sessionId);
          
          if (!session) {
            console.log(`Session ${code} not found for rejoining`);
            socket.emit('session-error', {
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found'
            });
            return;
          }
          
          console.log(`Found session ${sessionId} for code ${code}`);
          
          // Join the session room
          socket.join(sessionId);
          
          // If this is a presenter rejoining their session
          if (isPresenter) {
            // Update the presenter ID in the session
            console.log(`Presenter ${socket.id} rejoined session ${sessionId}`);
            session.presenterSocketId = socket.id;
            session.lastActive = Date.now();
            
            // Emit session rejoined event with current state
            socket.emit('session-rejoined', {
              sessionId,
              id: sessionId,
              code: session.code,
              title: session.title || 'Interactive Session',
              participantCount: session.participants.size,
              activeActivity: session.activeActivity
            });
          } 
          // If this is a participant joining
          else {
            console.log(`Participant ${socket.id} rejoined session ${sessionId}`);
            
            // Update the participant data
            socket.data = { 
              userId: data.userId || socket.id, 
              userName: data.userName || 'Anonymous' 
            };
            
            // Add participant to the session
            session.participants.add(socket.id);
            session.participantCount = session.participants.size;
            session.lastActive = Date.now();
            
            // Notify the participant of the current active activity, if any
            if (session.activeActivity) {
              socket.emit('activity-updated', session.activeActivity);
            }
            
            // Notify the presenter of the new participant
            const presenterSocket = io.sockets.sockets.get(session.presenterSocketId);
            if (presenterSocket) {
              presenterSocket.emit('participant-joined', {
                participantId: socket.id,
                participantCount: session.participantCount,
                userName: socket.data.userName || 'Anonymous'
              });
            }
            
            // Emit session joined event
            socket.emit('session-joined', {
              sessionId,
              id: sessionId,
              code: session.code,
              title: session.title || 'Interactive Session',
              activeActivity: session.activeActivity
            });
          }
        } catch (error) {
          console.error('Error rejoining session:', error);
          socket.emit('session-error', {
            code: 'REJOIN_FAILED',
            message: 'Failed to rejoin session: ' + (error.message || 'Unknown error')
          });
        }
      });
      
      // Add diagnostic ping handler for connection testing
      socket.on('diagnostic-ping', (data) => {
        console.log(`Diagnostic ping received from ${socket.id}:`, data);
        // Respond with an immediate pong that includes the original data
        socket.emit('diagnostic-pong', {
          originalData: data,
          serverId: socket.id,
          serverTime: new Date().toISOString(),
          transport: socket.conn?.transport?.name || 'unknown',
        });
      });
      
      // Add ping handlers for connection keep-alive
      socket.on('ping', (data) => {
        // Respond immediately with pong
        socket.emit('pong', {
          serverTime: Date.now(),
          clientTime: data.timestamp || Date.now(),
          socketId: socket.id
        });
      });
      
      // Add specific handling for heartbeat
      socket.on('heartbeat', (data) => {
        // Keep track of the heartbeat for session management
        const { sessionId, sessionCode } = data;
        
        // Update session last active time if we have session info
        if (sessionId && activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId);
          session.lastActive = Date.now();
        } else if (sessionCode && sessionCodes.has(sessionCode)) {
          const id = sessionCodes.get(sessionCode);
          if (id && activeSessions.has(id)) {
            const session = activeSessions.get(id);
            session.lastActive = Date.now();
          }
        }
        
        // Always respond to confirm receipt
        socket.emit('heartbeat-ack', {
          received: true,
          timestamp: Date.now(),
          serverSocketId: socket.id
        });
      });
      
      // Handle client disconnection
      socket.on('disconnect', (reason) => {
        try {
          console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
          
          // Get client info
          const clientInfo = connectedClients.get(socket.id);
          if (clientInfo) {
            console.log(`Disconnected client info:`, JSON.stringify(clientInfo));
            
            // If client was a presenter, mark the session as presenter-disconnected
            if (clientInfo.role === 'presenter' && clientInfo.sessionId) {
              const session = activeSessions.get(clientInfo.sessionId);
              if (session) {
                session.presenterConnected = false;
                session.lastPresenterDisconnect = Date.now();
                console.log(`Presenter disconnected from session ${clientInfo.sessionId}`);
              }
            }
            
            // If client was a participant, update the session participant count
            if ((clientInfo.role === 'participant' || clientInfo.role === 'viewer') && 
                (clientInfo.sessionId || clientInfo.sessionCode)) {
                
              // Try to find the session
              const sessionId = clientInfo.sessionId;
              const sessionCode = clientInfo.sessionCode;
              
              let session = null;
              if (sessionId && activeSessions.has(sessionId)) {
                session = activeSessions.get(sessionId);
              } else if (sessionCode && sessionCodes.has(sessionCode)) {
                const id = sessionCodes.get(sessionCode);
                if (id) session = activeSessions.get(id);
              }
              
              if (session) {
                // Different logic depending on whether participants is a Map or Set
                let participantRemoved = false;
                
                // If we have a specific participant ID
                if (clientInfo.participantId && session.participants instanceof Map) {
                  participantRemoved = session.participants.delete(clientInfo.participantId);
                  console.log(`Removed participant ${clientInfo.participantId} from session ${session.id}: ${participantRemoved}`);
                } 
                // If we're using socket ID in a Set
                else if (session.participants instanceof Set) {
                  participantRemoved = session.participants.delete(socket.id);
                  console.log(`Removed socket ${socket.id} from participants set in session ${session.id}: ${participantRemoved}`);
                }
                
                // Update the count
                const prevCount = session.participantCount || 0;
                session.participantCount = session.participants ? 
                  (session.participants instanceof Map ? session.participants.size : session.participants.size) : 0;
                
                console.log(`Participant count updated on disconnect: ${prevCount} -> ${session.participantCount} in session ${session.id}`);
                
                // Notify presenter if still connected
                if (session.presenterSocketId) {
                  io.to(session.presenterSocketId).emit('participant-left', {
                    participantId: clientInfo.participantId || socket.id,
                    participantCount: session.participantCount
                  });
                  console.log(`Notified presenter ${session.presenterSocketId} about participant leaving`);
                }
              } else {
                console.log(`Session not found for disconnecting participant: sessionId=${sessionId}, sessionCode=${sessionCode}`);
              }
            }
            
            // Remove client from connected clients
            connectedClients.delete(socket.id);
          }
        } catch (error) {
          console.error('Error handling disconnection:', error);
        }
      });
      
      // Add a new handler for direct session-join requests
      socket.on('session-join', (sessionCode, userData, callback) => {
        try {
          console.log(`Direct session-join request from ${socket.id} for session ${sessionCode}`);
          
          // First check session codes map
          let session = null;
          let sessionId = null;
          
          if (sessionCodes.has(sessionCode)) {
            sessionId = sessionCodes.get(sessionCode);
            console.log(`Found session ID ${sessionId} for code ${sessionCode}`);
            session = activeSessions.get(sessionId);
          }
          
          // Try other ways of finding the session if not found
          if (!session) {
            // Try direct lookup (for backward compatibility)
            const fullSessionId = sessionCode.startsWith('session_') ? sessionCode : `session_${sessionCode}`;
            session = activeSessions.get(fullSessionId);
            sessionId = fullSessionId;
            
            if (session) {
              console.log(`Found session via direct lookup: ${sessionId}`);
            } else {
              console.error(`Session with code ${sessionCode} not found via any method`);
              console.log('Available sessionCodes:', Array.from(sessionCodes.entries()));
              console.log('Available sessions:', Array.from(activeSessions.keys()));
              
              if (callback) callback({ error: 'Session not found' });
              else socket.emit('session-error', { code: 'SESSION_NOT_FOUND', message: 'Session not found' });
              return;
            }
          }
          
          // Join the session room
          socket.join(sessionId);
          console.log(`Client ${socket.id} joined room ${sessionId}`);
          
          // Add participant to session
          if (!session.participants) {
            session.participants = new Set();
          }
          
          session.participants.add(socket.id);
          session.participantCount = session.participants.size;
          
          // Store participant data
          socket.data = {
            userId: socket.id,
            userName: userData?.name || 'Anonymous',
            joinedAt: Date.now()
          };
          
          // Update client info
          const clientInfo = connectedClients.get(socket.id) || {};
          clientInfo.sessionId = sessionId;
          clientInfo.sessionCode = sessionCode;
          clientInfo.role = 'participant';
          connectedClients.set(socket.id, clientInfo);
          
          // Send current session info
          socket.emit('session-info', {
            sessionId: sessionId,
            code: session.code,
            title: session.title || 'Interactive Session',
            activeActivity: session.activeActivity
          });
          
          // Notify presenter about new participant
          if (session.presenterSocketId) {
            io.to(session.presenterSocketId).emit('participant-joined', {
              participantId: socket.id,
              participantCount: session.participantCount,
              userName: socket.data.userName
            });
          }
          
          console.log(`Participant ${socket.id} joined session ${sessionId}, count: ${session.participantCount}`);
          
          if (callback) callback({ success: true });
        } catch (error) {
          console.error('Error handling direct session-join:', error);
          if (callback) callback({ error: error.message || 'Error joining session' });
        }
      });
      
      // Add handler for request-session-info
      socket.on('request-session-info', (data) => {
        try {
          const { sessionCode } = data;
          console.log(`Session info requested for code: ${sessionCode}`);
          
          // Find session
          const sessionId = sessionCodes.get(sessionCode);
          const session = sessionId ? activeSessions.get(sessionId) : null;
          
          if (session) {
            // Send session info
            socket.emit('session-info', {
              sessionId: session.id,
              code: session.code,
              title: session.title || 'Interactive Session',
              activeActivity: session.activeActivity
            });
            
            console.log(`Session info sent for ${sessionCode}, has active activity: ${!!session.activeActivity}`);
          } else {
            console.error(`Cannot find session for code: ${sessionCode}`);
            socket.emit('session-error', { 
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found'
            });
          }
        } catch (error) {
          console.error('Error handling request-session-info:', error);
          socket.emit('session-error', { 
            code: 'INTERNAL_ERROR',
            message: 'Error processing session info request'
          });
        }
      });
      
      // Add a new handler for participant activity responses
      socket.on('activity-response', async (data, callback) => {
        try {
          const { sessionId, sessionCode, activityId, responseData } = data;
          console.log(`Received activity-response for session ${sessionId || sessionCode}, activity ${activityId}:`, responseData);
          
          // Find the session
          const session = findSessionByIdOrCode(sessionId, sessionCode);
          
          if (!session) {
            console.error(`Session ${sessionId || sessionCode} not found for activity response`);
            if (callback) callback({ error: 'Session not found' });
            return;
          }
          
          // Extract responseData based on activity type
          let extractedResponseData = responseData;
          if (session.activeActivity && session.activeActivity.type) {
            switch (session.activeActivity.type) {
              case 'wordcloud':
                // Accept string or { word: ... }
                if (typeof responseData === 'string') {
                  extractedResponseData = responseData;
                } else if (responseData && typeof responseData.word === 'string') {
                  extractedResponseData = responseData.word;
                } else {
                  extractedResponseData = null;
                }
                break;
              case 'poll':
                // Accept { selectedOption: ... } or direct index/answer
                if (typeof responseData === 'number') {
                  extractedResponseData = responseData;
                } else if (responseData && typeof responseData.selectedOption !== 'undefined') {
                  extractedResponseData = responseData.selectedOption;
                } else {
                  extractedResponseData = null;
                }
                break;
              case 'quiz':
                // Accept { answer: ... } or direct answer
                if (typeof responseData === 'string' || typeof responseData === 'number') {
                  extractedResponseData = responseData;
                } else if (responseData && typeof responseData.answer !== 'undefined') {
                  extractedResponseData = responseData.answer;
                } else {
                  extractedResponseData = null;
                }
                break;
              case 'qna':
                // Accept { question: ..., answer: ... }
                if (responseData && typeof responseData.answer !== 'undefined') {
                  extractedResponseData = responseData.answer;
                } else {
                  extractedResponseData = responseData;
                }
                break;
              default:
                // Fallback: use as-is
                extractedResponseData = responseData;
            }
          }

          // Add the response to the activity ONLY if valid
          if (extractedResponseData !== undefined && extractedResponseData !== null) {
            if (session.activeActivity) {
              if (!session.activeActivity.responses) {
                session.activeActivity.responses = [];
              }
              session.activeActivity.responses.push(extractedResponseData);
            }
          } else {
            console.warn('Attempted to push null/undefined responseData for activity', activityId, data);
          }
          console.log('Pushed to responses:', extractedResponseData, 'Current responses:', session.activeActivity ? session.activeActivity.responses : []);

          // Store the response in the session
          if (!session.responses) session.responses = [];
          
          // Create a structured response object
          const response = {
            activityId,
            participantId: socket.id,
            userName: socket.data?.userName || 'Anonymous',
            responseData: extractedResponseData,
            timestamp: new Date().toISOString()
          };
          
          // Add response to session
          session.responses.push(response);
          session.totalResponses = (session.totalResponses || 0) + 1;
          session.lastActive = Date.now();
          
          console.log(`Added response to session ${session.id}, total responses: ${session.totalResponses}`);
          
          // **CRITICAL FIX**: Persist poll responses to Firestore for session-based retrieval
          if (session.activeActivity && session.activeActivity.type === 'poll' && extractedResponseData !== null && extractedResponseData !== undefined) {
            try {
              const sessionService = require('./sessionService');
              console.log(`[SOCKET DEBUG] Persisting poll response to Firestore: sessionId=${session.id}, pollId=${activityId}, optionIndex=${extractedResponseData}`);
              
              // Call sessionService to persist the response to Firestore
              await sessionService.addPollResponse(
                session.id,
                activityId,
                extractedResponseData,
                socket.id // Use socket ID as user ID
              );
              
              console.log(`[SOCKET DEBUG] Successfully persisted poll response to Firestore`);
            } catch (firestoreError) {
              console.error(`[SOCKET DEBUG] Failed to persist poll response to Firestore:`, firestoreError);
              // Don't fail the entire response flow if Firestore save fails
            }
          }
          
          // Forward response to presenter
          if (session.presenterSocketId) {
            console.log(`Forwarding response to presenter ${session.presenterSocketId}`);
            io.to(session.presenterSocketId).emit('response-received', {
              activityId,
              response: extractedResponseData,
              participantId: socket.id,
              participantName: socket.data?.userName || 'Anonymous'
            });
            
            // Also send updated results
            io.to(session.presenterSocketId).emit('activity-results-update', {
              activityId,
              responses: session.activeActivity ? session.activeActivity.responses : [],
              totalResponses: session.totalResponses
            });
          }
          
          // Send acknowledgment
          if (callback) {
            callback({ success: true });
          }
        } catch (error) {
          console.error('Error handling activity response:', error);
          if (callback) {
            callback({ error: error.message || 'Error processing activity response' });
          }
        }
      });
      
      // Handle legacy poll-response format
      socket.on('poll-response', (data) => {
        try {
          const { pollId, optionIndex, sessionCode } = data;
          console.log(`Received poll-response for poll ${pollId}, option ${optionIndex}`);
          
          // Convert to new format and process
          const response = {
            sessionCode,
            activityId: pollId,
            responseData: {
              selectedOption: optionIndex,
              timestamp: new Date().toISOString()
            }
          };
          
          // Process the response
          const session = findSessionByIdOrCode(null, sessionCode);
          
          if (!session) {
            console.error(`Session not found for poll response with code ${sessionCode}`);
            return;
          }
          
          console.log(`Processing legacy poll response for session ${session.id}`);
          
          // Store the response in the session
          if (!session.responses) session.responses = [];
          
          // Create a structured response object
          const responseObj = {
            activityId: pollId,
            participantId: socket.id,
            userName: socket.data?.userName || 'Anonymous',
            responseData: response.responseData,
            timestamp: new Date().toISOString()
          };
          
          // Add response to session
          session.responses.push(responseObj);
          session.totalResponses = (session.totalResponses || 0) + 1;
          session.lastActive = Date.now();
          
          // Forward to presenter
          if (session.presenterSocketId) {
            io.to(session.presenterSocketId).emit('response-received', {
              activityId: pollId,
              response: response.responseData,
              participantId: socket.id,
              participantName: socket.data?.userName || 'Anonymous'
            });
          }
        } catch (error) {
          console.error('Error handling poll response:', error);
        }
      });
      
      // End current activity
      socket.on('end-activity', ({ sessionId, activityId }) => {
        try {
          const session = activeSessions.get(sessionId);
          
          if (!session) {
            socket.emit('session-error', { 
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found' 
            });
            return;
          }
          
          // Clear session's active activity
          session.activeActivity = null;
          session.lastActive = Date.now();
          
          // Broadcast to all participants
          io.to(sessionId).emit('activity-ended', { activityId });
          
          console.log(`Activity ${activityId} ended in session ${sessionId}`);
        } catch (error) {
          console.error('Error ending activity:', error);
          socket.emit('session-error', {
            code: 'END_FAILED',
            message: 'Failed to end activity: ' + (error.message || 'Unknown error')
          });
        }
      });
      
      // End the entire session
      socket.on('end-session', ({ sessionId }) => {
        try {
          const session = activeSessions.get(sessionId);
          
          if (!session) {
            socket.emit('session-error', { 
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found' 
            });
            return;
          }
          
          // Broadcast session end to all participants
          io.to(sessionId).emit('session-ended');
          
          // Clean up the session
          activeSessions.delete(sessionId);
          
          console.log(`Session ${sessionId} ended by presenter ${socket.id}`);
        } catch (error) {
          console.error('Error ending session:', error);
          socket.emit('session-error', {
            code: 'END_FAILED',
            message: 'Failed to end session: ' + (error.message || 'Unknown error')
          });
        }
      });
    } catch (error) {
      console.error('Error connecting client:', error);
      socket.emit('session-error', {
        code: 'CONNECTION_ERROR',
        message: error.message || 'Failed to connect'
      });
    }
  });
};