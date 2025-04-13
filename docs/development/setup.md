# LearnConnectLive Development Setup Guide

This guide provides step-by-step instructions for setting up the LearnConnectLive development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v14 or higher - [Download Node.js](https://nodejs.org/)
- **npm**: v6 or higher (comes with Node.js)
- **Git**: for version control - [Download Git](https://git-scm.com/)
- **PostgreSQL**: (optional) only needed if not using Firebase - [Download PostgreSQL](https://www.postgresql.org/download/)
- **VSCode**: (recommended) or any code editor of your choice - [Download VSCode](https://code.visualstudio.com/)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd learnconnectlive
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Environment Variables

#### Backend Environment Variables

Create a `.env` file in the backend directory:

```bash
# Navigate to backend directory
cd backend

# Create .env file
touch .env
```

Add the following environment variables to the `.env` file:

```
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
USE_MOCK_DATA=false

# For PostgreSQL (optional, if using PostgreSQL)
DATABASE_URL=postgres://username:password@localhost:5432/livepoll

# For Firebase (optional, if using Firebase)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
```

#### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Navigate to frontend directory
cd frontend

# Create .env file
touch .env
```

Add the following environment variables to the `.env` file:

```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_WS_URL=http://localhost:5001
```

### 4. Database Setup

#### Option A: PostgreSQL Setup

If you're using PostgreSQL:

1. Create a new PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE livepoll;
\q
```

2. Run the database initialization script:

```bash
cd backend
npm run db:init
```

#### Option B: Firebase Setup

If you're using Firebase:

1. Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Set up Firestore database
3. Add a service account in Project Settings > Service Accounts
4. Generate a new private key and save it
5. Update your `.env` file with the Firebase credentials

### 5. Running the Application

#### Development Mode

To run both the frontend and backend in development mode:

```bash
# From the root directory
npm run dev:full
```

This will start:
- Backend server at http://localhost:5001
- Frontend development server at http://localhost:3000

To run just the backend:

```bash
npm run dev:backend
```

To run just the frontend:

```bash
cd frontend
npm start
```

### 6. Testing Socket.IO Communication

The application includes specialized tools for testing Socket.IO communication:

1. Start the application in development mode:

```bash
npm run dev:full
```

2. Navigate to the socket testing utility:
   - Real Socket Test: http://localhost:3000/test/realsocket
   - Mock Socket Test: http://localhost:3000/test/socket

3. Follow the on-screen instructions to test presenter and participant communication.

## Troubleshooting Common Issues

### Database Connection Issues

If you encounter database connection errors:

1. Verify that PostgreSQL is running
2. Check that the database name, username, and password in `.env` are correct
3. Try setting `USE_MOCK_DATA=true` to use mock data instead

### Socket.IO Connection Issues

If Socket.IO connections are failing:

1. Ensure that port 5001 is not being used by another application
2. Check browser console for CORS-related errors
3. Verify that the `REACT_APP_WS_URL` in frontend `.env` matches the backend URL
4. Try using the socket testing utilities to isolate the issue

### Frontend Build Issues

If you encounter issues building the frontend:

1. Clear node modules and reinstall:

```bash
cd frontend
rm -rf node_modules
npm install
```

2. Clear npm cache:

```bash
npm cache clean --force
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Tests

```bash
npm run test:e2e
```

## Development Workflow

1. Create a new branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git add .
git commit -m "Your descriptive commit message"
```

3. Push your changes to the remote repository:

```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request from your branch to the main branch

## Additional Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Socket.IO Documentation](https://socket.io/docs/v4)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)

## Need Help?

If you encounter any issues not covered in this guide, please:

1. Check the existing issues in the repository
2. Create a new issue with detailed information about your problem
3. Reach out to the development team 