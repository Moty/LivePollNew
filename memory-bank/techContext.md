# Technical Context

## Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI library | ^18.2.0 |
| React Router | Client-side routing | ^6.20.0 |
| Styled Components | CSS-in-JS styling | ^6.1.15 |
| Socket.IO Client | Real-time communication client | ^4.8.1 |
| Chart.js | Data visualization | ^4.4.0 |
| React Chart.js 2 | React wrapper for Chart.js | ^5.2.0 |
| React QR Code | QR code generation | ^2.0.15 |
| Axios | HTTP client | ^1.6.2 |
| d3 | Data visualization | ^7.8.5 |
| d3-cloud | Word cloud generation | ^1.2.7 |
| Material-UI | UI component library | ^7.0.2 |
| Formik | Form handling | ^2.4.5 |
| Yup | Schema validation | ^1.6.1 |
| React Beautiful DnD | Drag and drop | ^13.1.1 |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | JavaScript runtime | ^16.x |
| Express | Web framework | ^4.21.2 |
| Socket.IO | Real-time communication server | ^4.8.1 |
| PostgreSQL | Relational database | ^14.x |
| Firebase/Firestore | NoSQL database (alternative) | ^10.14.1 |
| Firebase Admin | Server-side Firebase SDK | ^12.7.0 |
| JWT | Authentication | ^9.0.2 |
| CORS | Cross-origin resource sharing | ^2.8.5 |
| Helmet | Security middleware | ^8.0.0 |
| Morgan | HTTP request logger | ^1.10.0 |
| Express Rate Limit | Rate limiting middleware | ^7.5.0 |
| Express Validator | Input validation | ^7.2.1 |
| Compression | Response compression | ^1.8.0 |

## Development Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL (v14) or Firebase account
- Git

### Local Setup Process

1. **Clone Repository**
   ```bash
   git clone [repository-url]
   cd learnconnectlive
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment Configuration**
   - Create backend `.env` file
   ```
   PORT=5001
   NODE_ENV=development
   DATABASE_URL=postgres://user:password@localhost:5432/livepoll
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=http://localhost:3000
   USE_MOCK_DATA=false
   ```
   
   - Create frontend `.env` file
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   REACT_APP_SOCKET_URL=http://localhost:5001
   ```

4. **Database Setup**
   - PostgreSQL:
     - Create database: `createdb livepoll`
     - Run migrations: `npm run migrate`
   
   - Firebase (Alternative):
     - Add Firebase credentials to `firebase-credentials.json`

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately
   npm run dev:backend    # Start backend only
   npm run dev:frontend   # Start frontend only
   ```

## Technical Constraints

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)
- Mobile browsers (iOS Safari, Android Chrome)

### Network Requirements
- WebSocket support for optimal performance
- HTTP fallback for restricted environments
- Minimum 1Mbps connection for acceptable experience

### Performance Targets
- Initial load time: < 2 seconds
- Time to interactive: < 3 seconds
- Response time for actions: < 300ms
- Supports 50+ concurrent users per session

### Hosting Requirements
- Node.js compatible environment
- WebSocket support
- PostgreSQL database or Firebase service
- Redis for session management (optional)

## Code Standards

### JavaScript/TypeScript
- ES6+ syntax
- Functional programming approach where appropriate
- Strict prop types validation
- JSDoc comments for public APIs

### React Component Standards
- Functional components with hooks
- Props destructuring in parameter list
- PropTypes or TypeScript interfaces
- Styled components for styling

### File Structure
- Feature-based organization
- Consistent import ordering
- Component co-location with styles
- Clear separation of concerns

### Naming Conventions
- Components: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: lowercase with hyphens for multi-word

## Dependencies and Third-Party Services

### Critical Dependencies
- Socket.IO: Real-time communication framework
- React: Frontend UI library
- Express: Backend web framework
- PostgreSQL/Firebase: Data storage

### External Services
- Firebase (optional): Authentication, database, hosting
- S3 or equivalent: File storage for exports and assets
- SendGrid or equivalent: Email notifications (future)

### Development Dependencies
- ESLint: Code linting
- Prettier: Code formatting
- Jest: Testing framework
- React Testing Library: Component testing
- Nodemon: Server auto-restart during development

## Deployment Strategy

### Development Environment
- Local development setup
- Feature branches for development
- Integrated testing environment

### Staging Environment
- Similar to production configuration
- Used for integration testing and UAT
- Automatic deployment from main branch

### Production Environment
- Node.js server in production mode
- Database with proper security configurations
- SSL encryption for all communication
- Rate limiting and security measures

### Deployment Process
1. Build frontend assets
2. Run tests
3. Deploy backend with updated frontend assets
4. Run database migrations if needed
5. Verify deployment

## Integration Points

### External Authentication (Future)
- OAuth 2.0 integration capabilities
- Enterprise SSO support (SAML, AD)

### Content Platforms
- LMS integration via API
- Presentation software plugins (future)

### Analytics and Reporting
- Export to CSV/Excel
- PDF report generation
- Integration with analytics platforms (future)

## Security Considerations

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management with secure cookies

### Data Protection
- HTTPS for all communications
- Database encryption for sensitive data
- Input validation and sanitization

### Authorization
- Role-based access control
- Resource ownership validation
- API endpoint protection 

## Enhanced Activity Features

### Poll Visualizations
- Using Chart.js for responsive and customizable visualizations
- Supporting various chart types (bar, pie, doughnut, line, horizontal bar)
- Providing animation customization for charts with preview capabilities

### Quiz Timer
- Implementing a countdown timer with requestAnimationFrame for smooth animations
- Using a custom CountdownTimer component with configurable settings
- Providing auto-advance functionality when time expires with configurable settings

### WordCloud Enhancements
- Using d3-cloud for word cloud generation with custom enhancements for shapes and color schemes
- Providing customizable options for word cloud appearance and behavior
- Integrating word cloud with other activity features for enhanced user experience