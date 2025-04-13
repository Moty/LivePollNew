# Socket Communication Debugging Plan

## Issue Summary
Activities are not being presented on the participant view when using the real socket implementation, despite working correctly in test mode. This suggests a discrepancy between how activities are communicated in the test environment versus the real socket implementation.

## Root Cause Analysis
Based on reviewing the code in `RealSocketTest.js`, I've identified several potential issues:

1. **Event Name Inconsistency**: The presenter component is trying multiple event formats when starting activities, while the participant component is listening for several different events.

2. **Data Format Inconsistency**: The data structure being sent may differ between test mode and real socket implementation.

3. **Room/Session Joining Issues**: Participants may not be properly joined to the socket room.

4. **Socket Connection Sequence**: The timing of connection, joining, and event emission may be causing issues.

5. **Server-Side Socket Handling**: The server-side socket handlers may not be forwarding events properly.

## Debugging Steps

### Step 1: Add Enhanced Logging
First, we'll add improved logging to identify exactly where the communication breaks down:

1. Log all socket events being emitted by the presenter
2. Log all socket events being received by the participant
3. Add timestamps to track the sequence of operations

### Step 2: Standardize Event Naming Convention
Establish a consistent naming convention for socket events:
- Presenter to server: `start-activity`
- Server to participants: `activity-started`

### Step 3: Implement Data Structure Verification
Ensure consistent data structure is being sent and received:
- From presenter to server
- From server to participants

### Step 4: Fix Socket Implementation Issues

#### Presenter Component Updates
1. Simplify the activity starting process to use a single, standard event format
2. Ensure proper session management before starting activities
3. Add retry logic for socket operations

#### Participant Component Updates
1. Standardize event listeners to match what the server is actually sending
2. Improve connection and session joining sequence
3. Add explicit handling for activity data format variations

### Step 5: Add Socket Health Monitoring
1. Implement socket connection quality monitoring
2. Add automatic reconnection for unstable connections
3. Implement a fallback mechanism when socket events fail

## Implementation Plan

### 1. RealSocketTest.js - Presenter Component Changes

#### A. Simplify Activity Starting Logic
Replace the current complex multi-format approach with a single, consistent method:

```javascript
// Before: Multiple event formats and fallbacks
socketRef.current.emit('start-activity', { activity, sessionCode });
socketRef.current.emit('start-activity', { activityId: activity.id, sessionId: sessionMock.id, sessionCode });
socketRef.current.emit('activity-started', activity);

// After: Single, consistent format with better error handling
socketRef.current.emit('start-activity', { 
  activity,
  sessionCode,
  timestamp: Date.now()
}, (response) => {
  if (response && response.success) {
    onLog(`Activity started successfully: ${activity.type}`, 'presenter');
    setActivityActive(true);
  } else {
    onLog(`Failed to start activity: ${response?.message || 'No response from server'}`, 'presenter-error');
    // Implement proper error handling here
  }
});
```

#### B. Add Socket Health Check
```javascript
// Add a periodic health check to verify socket connection
const healthCheckInterval = setInterval(() => {
  if (socketRef.current && socketRef.current.connected) {
    socketRef.current.emit('ping', { timestamp: Date.now() }, (response) => {
      const latency = Date.now() - response.timestamp;
      onLog(`Socket connection healthy. Latency: ${latency}ms`, 'presenter');
    });
  }
}, 30000); // Check every 30 seconds

// Clean up on component unmount
useEffect(() => {
  return () => {
    clearInterval(healthCheckInterval);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };
}, []);
```

### 2. RealSocketTest.js - Participant Component Changes

#### A. Standardize Event Listeners
```javascript
// Before: Multiple overlapping event listeners
socketRef.current.on('session-info', (data) => {...});
socketRef.current.on('activity-started', (data) => {...});
socketRef.current.on('start-activity', (data) => {...});
socketRef.current.on('update-activity', (data) => {...});
socketRef.current.on('activity-updated', (data) => {...});

// After: Standardized event listeners with consistent handling
socketRef.current.on('activity-started', (data) => {
  const activity = data.activity || data;
  onLog(`Activity started event received: ${JSON.stringify(data)}`, 'participant');
  setActiveActivity(activity);
});

// Handle legacy event format for backward compatibility
socketRef.current.on('start-activity', (data) => {
  onLog(`Start activity event received (legacy format): ${JSON.stringify(data)}`, 'participant');
  const activity = data.activity || data;
  setActiveActivity(activity);
});

// Log any unknown event format for debugging
socketRef.current.onAny((event, ...args) => {
  if (!['connect', 'disconnect', 'error', 'session-info', 'activity-started', 
        'start-activity', 'activity-ended', 'end-activity'].includes(event)) {
    onLog(`Unknown event received: ${event} with data: ${JSON.stringify(args)}`, 'participant');
    
    // Check if this could be an activity event with non-standard format
    const potentialActivity = args[0];
    if (potentialActivity && (potentialActivity.type || potentialActivity.activity)) {
      onLog(`Detected possible activity data in unknown event`, 'participant');
      const activity = potentialActivity.activity || potentialActivity;
      setActiveActivity(activity);
    }
  }
});
```

#### B. Improve Connection and Session Joining Sequence
```javascript
// Add a more robust connection and session joining sequence
const connect = () => {
  try {
    // First disconnect if already connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
    
    onLog('Attempting to connect to socket server...', 'participant');
    
    socketRef.current = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    // Setup connection event handlers first
    socketRef.current.on('connect', () => {
      setConnected(true);
      onLog('Participant connected to socket', 'participant');
      
      // Automatically join session after successful connection
      if (sessionCode && userName) {
        joinSession();
      }
    });
    
    // Setup all other event handlers
    // ... existing event handlers ...
    
  } catch (error) {
    onLog(`Error connecting: ${error.message}`, 'participant-error');
  }
};

// Make joining a session more robust
const joinSession = () => {
  if (!connected || !socketRef.current) {
    onLog('Cannot join session: Socket not connected', 'participant-error');
    return;
  }
  
  try {
    onLog(`Attempting to join session: ${sessionCode} as ${userName}`, 'participant');
    
    socketRef.current.emit('join-session', {
      sessionCode,
      userName,
      timestamp: Date.now()
    }, (response) => {
      if (response && response.success) {
        onLog(`Joined session successfully: ${sessionCode}`, 'participant');
        setSessionJoined(true);
        
        // Explicitly request current session state including any active activity
        socketRef.current.emit('get-session-info', { sessionCode }, (sessionInfo) => {
          onLog(`Received session info: ${JSON.stringify(sessionInfo)}`, 'participant');
          
          if (sessionInfo && sessionInfo.activeActivity) {
            setActiveActivity(sessionInfo.activeActivity);
            onLog(`Active activity detected on join: ${sessionInfo.activeActivity.type}`, 'participant');
          }
        });
      } else {
        onLog(`Failed to join session: ${response?.message || 'Unknown error'}`, 'participant-error');
      }
    });
  } catch (error) {
    onLog(`Error joining session: ${error.message}`, 'participant-error');
  }
};
```

### 3. Backend/Server Changes (if applicable)

If you have access to modify the server-side socket implementation, ensure:

1. The server has proper event forwarding logic:
```javascript
// When receiving a start-activity event from a presenter
socket.on('start-activity', (data, callback) => {
  // Validate the request
  const { activity, sessionCode } = data;
  if (!activity || !sessionCode) {
    return callback({ success: false, message: 'Missing required fields' });
  }
  
  // Update session state in the database/memory
  sessions.set(sessionCode, { ...sessions.get(sessionCode), activeActivity: activity });
  
  // Broadcast to all participants in the room
  socket.to(sessionCode).emit('activity-started', { activity });
  
  // Confirm success to presenter
  callback({ success: true });
});
```

2. Proper room/session management:
```javascript
// When a participant joins a session
socket.on('join-session', (data, callback) => {
  const { sessionCode, userName } = data;
  
  // Validate the session exists
  if (!sessions.has(sessionCode)) {
    return callback({ success: false, message: 'Session not found' });
  }
  
  // Add the socket to the room
  socket.join(sessionCode);
  
  // Update participant count
  const participantCount = getSocketsInRoom(sessionCode).length;
  
  // Notify the presenter
  socket.to(sessionCode).emit('participant-joined', { 
    participantId: socket.id,
    userName,
    participantCount
  });
  
  // Send current session state to the joining participant
  callback({
    success: true,
    sessionInfo: sessions.get(sessionCode)
  });
});
```

## Testing Strategy

1. **Component Testing**:
   - Test presenter component in isolation to verify events are emitted correctly
   - Test participant component in isolation to verify events are processed correctly

2. **Integration Testing**:
   - Test end-to-end flow with presenter starting activities and participants receiving them
   - Test with different activity types (poll, quiz, wordcloud, etc.)
   - Test reconnection scenarios and error handling

3. **Performance Testing**:
   - Test with multiple participants to ensure scalability
   - Test with poor network conditions to ensure robustness

## Implementation Timeline

1. Enhanced Logging (2 hours)
2. Presenter Component Updates (3 hours)
3. Participant Component Updates (3 hours)
4. Server-Side Updates (if applicable) (4 hours)
5. Testing and Debugging (4 hours)
6. Documentation (2 hours)

Total Estimated Time: 18 hours

## Expected Outcomes

1. Activities will be correctly displayed on the participant view when using real sockets
2. Improved error handling for socket communication issues
3. More robust reconnection behavior for unstable connections
4. Better logging for future debugging

## Backup Plan

If the socket implementation continues to have issues, we will:

1. Create a polling-based fallback mechanism
2. Implement a client-side activity cache
3. Consider alternative real-time communication libraries
