# Socket.IO Event Standardization Guide

This document defines the standard Socket.IO events used throughout the LearnConnectLive platform to ensure consistent communication between the frontend and backend systems.

## Event Naming Conventions

All event names follow these conventions:
- Hyphen-separated lowercase words
- Action-oriented prefixes (e.g., `join`, `create`, `update`)
- Entity-focused suffixes (e.g., `session`, `activity`, `response`)

## Connection Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `connect` | Client & Server | Fired when a socket connection is established | None |
| `disconnect` | Client & Server | Fired when a socket connection is closed | Reason string |
| `reconnect` | Client → Server | Client attempting to reconnect | { sessionCode, participantId } |
| `connection-status` | Server → Client | Updates on connection status | { status, message } |
| `error` | Server → Client | Error information | { code, message, details } |

## Session Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `create-session` | Client → Server | Request to create a new session | { presentationId } |
| `session-created` | Server → Client | Confirmation of session creation | { sessionId, sessionCode, createdAt } |
| `join-session` | Client → Server | Request to join an existing session | { sessionCode, participantName, fingerprintId } |
| `session-joined` | Server → Client | Confirmation of joining a session | { sessionId, sessionCode, title } |
| `session-info` | Server → Client | Current session information | { sessionId, title, participants, activeActivity } |
| `session-ended` | Server → Client | Notification that session has ended | { sessionId, sessionCode } |
| `participant-joined` | Server → Client | New participant joined the session | { participantId, participantName } |
| `participant-left` | Server → Client | Participant left the session | { participantId } |
| `update-participant-count` | Server → Client | Updated count of participants | { count } |

## Activity Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `start-activity` | Client → Server | Start a new activity | { sessionId, activityId, activityType, config } |
| `activity-started` | Server → Client | An activity has been started | { activityId, activityType, config, startedAt } |
| `update-activity` | Client → Server | Update an ongoing activity | { sessionId, activityId, updates } |
| `activity-updated` | Server → Client | An activity has been updated | { activityId, updates, updatedAt } |
| `end-activity` | Client → Server | End the current activity | { sessionId, activityId } |
| `activity-ended` | Server → Client | An activity has ended | { activityId, endedAt } |

## Response Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `activity-response` | Client → Server | Submit a response to an activity | { sessionId, activityId, response, participantId } |
| `response-received` | Server → Client | Confirmation of response receipt | { responseId, activityId, status } |
| `response-update` | Server → Client | Update on response statistics | { activityId, statistics } |

## Poll-Specific Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `poll-response` | Client → Server | Submit a response to a poll | { sessionId, activityId, optionId, participantId } |
| `poll-results` | Server → Client | Current poll results | { activityId, options, counts, totalResponses } |

## Quiz-Specific Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `quiz-response` | Client → Server | Submit an answer to a quiz | { sessionId, activityId, questionId, answerId, timeTaken, participantId } |
| `quiz-results` | Server → Client | Current quiz results | { activityId, questions, answerCounts, correctCounts } |
| `quiz-leaderboard` | Server → Client | Current quiz leaderboard | { activityId, participants, scores } |

## WordCloud-Specific Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `wordcloud-submission` | Client → Server | Submit words for a word cloud | { sessionId, activityId, words, participantId } |
| `wordcloud-update` | Server → Client | Current word cloud data | { activityId, words, frequencies } |

## Q&A-Specific Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `qa-question` | Client → Server | Submit a question for Q&A | { sessionId, activityId, question, participantId } |
| `qa-upvote` | Client → Server | Upvote a question | { sessionId, activityId, questionId, participantId } |
| `qa-answer` | Client → Server | Answer a question (presenter) | { sessionId, activityId, questionId, answer } |
| `qa-update` | Server → Client | Current Q&A data | { activityId, questions, upvotes, answers } |

## Debugging Events

| Event Name | Direction | Description | Payload |
|------------|-----------|-------------|---------|
| `log-event` | Bidirectional | Log message for debugging | { level, message, context } |
| `connection-debug` | Server → Client | Detailed connection status | { connectionId, status, transport, attempts } |
| `event-debug` | Server → Client | Debug info for event processing | { eventName, received, processed, error } |

## Event Flow Examples

### Typical Session Creation and Activity Flow

1. Client connects to Socket.IO server
2. Client sends `create-session` with presentation ID
3. Server responds with `session-created` and session details
4. Participants connect and send `join-session` with the session code
5. Server responds with `session-joined` and session information
6. Server sends `participant-joined` to the presenter
7. Presenter sends `start-activity` to begin an activity
8. Server broadcasts `activity-started` to all participants
9. Participants send `activity-response` with their responses
10. Server sends `response-update` to the presenter with live statistics
11. Presenter sends `end-activity` to conclude the activity
12. Server broadcasts `activity-ended` to all participants

### Handling Reconnections

1. Client disconnects unexpectedly
2. Client reconnects and sends `reconnect` with session information
3. Server validates the information and restores the session state
4. Server sends `session-info` with the current state
5. If an activity is in progress, server sends `activity-started` or `activity-updated`
6. Normal communication continues

## Error Handling Guidelines

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_SESSION` | Session does not exist or is expired | Redirect to join page |
| `PERMISSION_DENIED` | User lacks permission for the action | Display error |
| `RATE_LIMITED` | Too many requests | Implement backoff and retry |
| `INVALID_PAYLOAD` | Malformed event data | Log error and fix client code |
| `ACTIVITY_ERROR` | Error processing activity | Retry or fallback to previous state |

### Error Event Format

```javascript
{
  code: "ERROR_CODE",
  message: "Human-readable error message",
  details: {
    // Additional context-specific information
  }
}
```

## Best Practices

1. **Always acknowledge events** - Use acknowledgment callbacks to confirm receipt
2. **Include timestamps** - Add serverTime to relevant events for synchronization
3. **Implement retry logic** - For critical events, retry with backoff if no acknowledgment
4. **Validate payloads** - Both client and server should validate event payloads
5. **Handle reconnection gracefully** - Restore state and catch up missed events
6. **Log important events** - Maintain logs for debugging purposes
7. **Use standard event names** - Follow the conventions in this document
8. **Include correlation IDs** - For tracking related events in a sequence

## Migration Path

If your code uses legacy event names, use this mapping table to update to standardized events:

| Legacy Event | Standardized Event |
|--------------|-------------------|
| `update-activity` | `activity-updated` |
| `activity-started` | `activity-started` (unchanged) |
| `submit-response` | `activity-response` |
| `poll-response` | `activity-response` (with activityType: 'poll') |
| `end-activity` | `activity-ended` |
| `get-session-info` | `session-info` |

## Event Payload Schemas

For detailed JSON schemas of all event payloads, see the [Socket Event Schemas](./socket-event-schemas.json) file.

## Testing Socket Events

Use the testing utility at `/test/realsocket` in the application to test socket communication between presenter and participant views. This tool provides:

- Side-by-side presenter and participant panels
- Detailed event logging with color-coded messages
- Support for all activity types
- Custom command sending capability
- Event standardization testing
- Connection stability verification 