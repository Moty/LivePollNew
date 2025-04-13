# LearnConnectLive System Architecture Overview

## System Overview

LearnConnectLive is a real-time interactive presentation platform built using a modern client-server architecture. The platform enables presenters to create engaging presentations with interactive activities such as polls, quizzes, Q&A sessions, and word clouds, while participants can join these sessions and interact in real-time.

## Architecture Components

```
┌─────────────────┐       ┌──────────────────┐      ┌─────────────────┐
│    Frontend     │◄─────►│     Backend      │◄────►│    Database     │
│  (React.js SPA) │       │  (Node.js/Express)│      │  (PostgreSQL/   │
└─────────────────┘       └──────────────────┘      │   Firebase)     │
                                   ▲                 └─────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Socket.IO Server │
                          │  (Real-time Comm) │
                          └──────────────────┘
```

### 1. Frontend (React.js Single Page Application)

The frontend is built with React.js as a single-page application (SPA), providing a responsive and interactive user interface for both presenters and participants.

**Key Components:**
- **Dashboard**: Manages presentations and provides analytics
- **CreatePresentation**: Interface for creating and configuring presentations
- **PresentationView**: Presenter's view for controlling active sessions
- **ParticipantView**: Interface for participants to join and interact with sessions
- **Activity Components**: Specialized components for different activity types (Poll, Quiz, WordCloud, Q&A)

**State Management:**
- React Context API for global state management
- Local component state for UI-specific state
- Custom hooks for shared functionality

### 2. Backend (Node.js with Express)

The backend server is built with Node.js and Express, providing RESTful API endpoints for data management and business logic.

**Key Components:**
- **API Routes**: RESTful endpoints for CRUD operations
- **Controllers**: Business logic for handling requests
- **Services**: Reusable business logic and utilities
- **Middleware**: Authentication, validation, and error handling
- **Models**: Data models and database interactions

**Authentication:**
- JWT-based authentication
- Role-based access control
- Development mode bypass for testing

### 3. Socket.IO Server (Real-time Communication)

Socket.IO provides real-time bidirectional communication between the frontend and backend, enabling interactive features and live updates.

**Key Features:**
- **Session Management**: Creating and maintaining presentation sessions
- **Activity Control**: Starting, updating, and ending activities
- **Participant Tracking**: Monitoring who is connected to a session
- **Response Collection**: Gathering and processing participant responses
- **Connection Recovery**: Handling reconnections and missed events

**Socket Event Standardization:**
- Standardized event names for consistent communication
- Structured event payloads for reliable data exchange
- Connection status monitoring and recovery

### 4. Database (PostgreSQL/Firebase)

The system supports both PostgreSQL and Firebase/Firestore as database options.

**Data Models:**
- **Users**: Authentication and user profile data
- **Presentations**: Presentation metadata and configuration
- **Activities**: Activity definitions and configuration
- **Sessions**: Active presentation sessions
- **Responses**: Participant responses to activities

**Fallback Mechanism:**
- Mock data service for development and database failures
- Automatic fallback detection and switching
- Consistent interface between real and mock data

## Communication Flows

### Presenter Flow
1. Presenter creates a presentation with activities
2. Presenter starts a presentation session
3. Socket.IO server creates a new session and provides a join code
4. Presenter controls activities (start, stop, update)
5. Socket.IO server broadcasts activity states to participants
6. Presenter receives real-time responses from participants

### Participant Flow
1. Participant navigates to join page and enters session code
2. Socket.IO establishes connection and joins the session
3. Participant receives current session state and active activity
4. Participant interacts with activities
5. Responses are sent via Socket.IO to the server
6. Server processes responses and broadcasts updates

## Key Technical Features

### Connection Stability
- WebSocket with long-polling fallback
- Automatic reconnection with exponential backoff
- Session persistence across reconnections
- Client-side connection monitoring

### Error Handling
- Comprehensive error logging
- Graceful degradation
- User-friendly error messages
- Automatic recovery mechanisms

### Performance Optimizations
- Minimized payload sizes
- Efficient event batching
- Database query optimization
- Client-side caching

## Deployment Architecture

The system is designed to be deployed to SAP BTP (Business Technology Platform) with configurations for different environments (development, testing, production).

```
┌─────────────────────────────────────────────────┐
│                    SAP BTP                      │
│                                                 │
│   ┌─────────────┐        ┌─────────────────┐   │
│   │  Frontend   │        │ Backend Services│   │
│   │  (Static)   │        │  (Node.js)      │   │
│   └─────────────┘        └─────────────────┘   │
│                                 │              │
│                                 ▼              │
│                          ┌─────────────────┐   │
│                          │   Database      │   │
│                          │ (PostgreSQL/    │   │
│                          │  Firestore)     │   │
│                          └─────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Security Considerations

- HTTPS for all communications
- JWT token authentication
- Input validation
- XSS protection
- CSRF protection
- Rate limiting
- Content filtering for user-generated content

## Future Architecture Extensions

- Message buffering for Socket.IO
- Database caching layer
- Data archiving process
- Horizontal scaling for Socket.IO with Redis adapter
- Advanced analytics processing
- PDF generation service 