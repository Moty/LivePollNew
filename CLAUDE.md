# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LivePoll is a real-time interactive presentation platform for live polling, quizzes, word clouds, and Q&A sessions. It uses a React frontend with a Node.js/Express backend, Firebase/Firestore for persistence, and Socket.IO for real-time communication.

## Development Commands

```bash
# Install dependencies (run from root)
npm install
cd frontend && npm install

# Run full stack development (backend + frontend concurrently)
npm run dev:full

# Run backend only (port 5001)
npm run dev:backend

# Run frontend only (port 3000)
npm run frontend

# Seed Firestore with sample data
npm run firebase:seed

# Create Firestore indexes
npm run firebase:indexes

# Run frontend tests
cd frontend && npm test
```

## Architecture

### Directory Structure
- `backend/src/` - Express server, routes, services, models
- `frontend/src/` - React application (Create React App)
- `memory-bank/` - Project documentation and patterns

### Backend (`backend/src/`)
- `server.js` - Main Express app with Socket.IO setup
- `routes/` - API endpoints (auth, polls, quizzes, wordclouds, qa, presentations, sessions)
- `services/socketService.js` - All real-time Socket.IO event handlers
- `services/firestoreService.js` - Firestore database operations
- `services/mockDataService.js` - Mock data for development without Firebase
- `config/firebase.js` - Firebase Admin SDK initialization
- `middleware/auth.js` - JWT authentication middleware

### Frontend (`frontend/src/`)
- `App.js` - Main router with protected routes
- `pages/` - Page components (Dashboard, CreatePresentation, EditPresentation, PresentationView, ParticipantView)
- `components/activities/` - Activity components (Poll, Quiz, WordCloud, QA)
- `contexts/AuthContext.js` - Authentication state and methods
- `services/api.js` - Axios-based API client

### Data Flow
1. Presenters create presentations with activities via REST API
2. Starting a presentation creates a Socket.IO session with a unique code
3. Participants join via `/join/:code` and connect to the same session
4. Activity responses flow through Socket.IO events to update all connected clients in real-time
5. Responses are persisted to Firestore for session results retrieval

## Key Patterns

### Socket Events (socketService.js)
- `create-session` - Presenter creates a new live session
- `join-session` - Participant joins via session code
- `start-activity` / `update-activity` - Broadcast activity to participants
- `activity-response` - Participant submits response
- `response-received` / `activity-results-update` - Responses forwarded to presenter

### Styled Components
Use transient props (prefix with `$`) for component-specific styling props that shouldn't pass to the DOM:
```jsx
<Button $variant="primary" $active={isActive}>
```

### Activity Mode
Activities use a `mode` property (`'edit'` or `'present'`) to conditionally render settings:
```jsx
{mode === 'edit' && (...settings UI...)}
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment (development/production)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - Firebase credentials
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `USE_MOCK_DATA` - Set to 'true' to use mock data instead of Firebase

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5001/api)
- `REACT_APP_SOCKET_URL` - Socket.IO URL (default: http://localhost:5001)
- `REACT_APP_ALLOW_DEV_AUTH_BYPASS` - Set to 'true' for development auth bypass

## Activity Types

- `poll` - Multiple choice voting with real-time results visualization
- `quiz` - Timed questions with correct answer tracking
- `wordcloud` - Open text responses rendered as word cloud
- `qa` - Question submission with upvoting

## Testing

Frontend tests use React Testing Library:
```bash
cd frontend
npm test                    # Run in watch mode
npm test -- --coverage      # Run with coverage
npm test -- --watchAll=false  # Run once (CI mode)
```

## Database Modes

The backend supports two modes:
1. **Firebase/Firestore** - Production database (requires Firebase credentials)
2. **Mock Data** - In-memory mock data for development without Firebase setup

Check `/api/health` endpoint to verify which mode is active.
