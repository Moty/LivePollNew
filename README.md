# LearnConnectLive - Interactive Presentation Platform

LearnConnectLive is a real-time interactive presentation platform that allows presenters to engage with their audience through various interactive activities like polls, quizzes, Q&A sessions, and word clouds.

## Features

- **Interactive Activities**
  - Live Polling with enhanced visualization options
  - Real-time Q&A Sessions
  - Interactive Quizzes
  - Word Cloud Generation
- **Real-time Updates** using WebSocket connections
- **Analytics Dashboard** for presentation insights
- **Data Export** capabilities
- **User Authentication** and protected routes
- **Responsive Design** for multiple device types
- **Participant Tracking** for session analytics
- **Robust Reconnection** capabilities for unstable networks

## Recent Updates

### April 2025 Updates
- ✅ Enhanced Poll visualization with multiple chart types (Bar, Pie, Doughnut, Horizontal)
- ✅ Added color scheme customization for visualizations
- ✅ Implemented animation controls for result updates
- ✅ Improved documentation with architecture diagrams and API references
- ✅ Fixed socket connection stability issues
- ✅ Improved participant tracking system
- ✅ Enhanced error handling in PresentationView
- ✅ Added more robust session recovery
- ✅ Implemented better timeout handling for API requests
- ✅ Added detailed debug logging for troubleshooting

### March 2025 Updates
- ✅ Fixed issue where activities stopped loading during presentations
- ✅ Enhanced WebSocket reconnection with exponential backoff
- ✅ Updated Dashboard component to use real API data
- ✅ Fixed activity creation in CreatePresentation component
- ✅ Improved UI/UX with better loading indicators and error messages
- ✅ Implemented database fallback solution with mock data
- ✅ Fixed authentication issues with better development mode handling

## Documentation

Comprehensive documentation is available in the `docs` directory:

- **Architecture**
  - [System Overview](docs/architecture/overview.md)
  - [Frontend Structure](docs/architecture/frontend-structure.md)
  - [Backend Structure](docs/architecture/backend-structure.md)

- **API Reference**
  - [API Endpoints](docs/api/endpoints.md)
  - [Socket Events](docs/api/socket-events.md)

- **Development Guides**
  - [Setup Guide](docs/development/setup.md)
  - [Testing Guide](docs/development/testing.md)
  - [Debugging Guide](docs/development/debugging.md)

- **User Guides**
  - [Presenter Guide](docs/user/presenter/getting-started.md)
  - [Participant Guide](docs/user/participant/joining-sessions.md)

## Tech Stack

### Frontend
- React.js (Create React App)
- WebSocket for real-time communication
- Context API for state management
- Styled Components for styling
- Chart.js for data visualization

### Backend
- Node.js
- Express.js
- WebSocket (Socket.io)
- PostgreSQL Database
- Firebase/Firestore (alternative to PostgreSQL)
- Rate limiting and input validation middleware

## Project Structure

```
├── frontend/                # React frontend application
│   ├── public/             # Public assets and index.html
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/    # Common UI components
│   │   │   ├── activities/# Activity-specific components
│   │   │   └── layout/    # Layout components
│   │   ├── contexts/      # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── styles/        # Global styles and theme
│   │   └── App.js        # Main application component
│
├── backend/               # Node.js backend server
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Data models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── server.js     # Server entry point
│
├── docs/                  # Documentation
│   ├── architecture/     # System architecture docs
│   ├── api/              # API documentation
│   ├── development/      # Development guides
│   └── user/             # User guides
│
└── README.md             # Project documentation
```

## Implementation Progress

We follow an Agile methodology with Test-Driven Development (TDD). See our [Implementation Progress](docs/implementation-progress.md) document for:
- Current sprint status
- Upcoming features
- TDD approach details
- Sprint timeline

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL or Firebase account

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd learnconnectlive
```

2. Install dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Set up environment variables:
Create `.env` files in both backend and frontend directories with necessary configuration.

### Running the Application

1. Start both backend and frontend:
```bash
npm run dev:full
```

Or start them separately:

```bash
# Backend only
npm run dev:backend

# Frontend only
cd frontend && npm start
```

The application will be available at `http://localhost:3000`

## Contributing

Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to the project.

## License

[Add your license information here]

## Support

[Add support contact information here]
