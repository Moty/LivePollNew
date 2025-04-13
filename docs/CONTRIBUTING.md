# Contributing to LearnConnectLive

Thank you for your interest in contributing to LearnConnectLive! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Test-Driven Development](#test-driven-development)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

We expect all contributors to follow our Code of Conduct. Please ensure you're familiar with it before contributing.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL or Firebase account
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/learnconnectlive.git
   cd learnconnectlive
   ```
3. Add the original repository as an upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/learnconnectlive.git
   ```
4. Install dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```
5. Set up environment variables:
   - Copy `.env.example` to `.env` in both the root and frontend directories
   - Update the values as needed for your development environment

6. Start the development servers:
   ```bash
   npm run dev:full
   ```

## Development Workflow

We follow a feature branch workflow:

1. Choose an issue to work on from our issue tracker or create a new one
2. Create a feature branch from the main branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Implement your changes following our Test-Driven Development approach
4. Commit your changes with clear commit messages:
   ```bash
   git commit -m "feat: add chart type selector for poll visualization"
   ```
5. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Create a Pull Request from your branch to the main repository

## Test-Driven Development

We follow a Test-Driven Development (TDD) approach for all new features:

1. **Write Tests First**: Begin by writing tests that define the expected behavior
2. **Run Tests (They Should Fail)**: Ensure your tests fail initially
3. **Implement Feature**: Write the code to make the tests pass
4. **Run Tests Again**: Verify your implementation works
5. **Refactor Code**: Clean up your code while ensuring tests still pass

### Example TDD Workflow

For a new feature like "Add chart type selector for polls":

1. Write a test in `frontend/src/components/activities/__tests__/ChartTypeSelector.test.js`
2. Run the test to confirm it fails
3. Implement the component in `frontend/src/components/activities/ChartTypeSelector.js`
4. Run the test again to verify it passes
5. Refactor the code for cleanliness and maintainability

## Pull Request Process

1. Ensure all tests pass locally before submitting your PR
2. Update documentation reflecting any changes to the interface or functionality
3. Include clear descriptions of the changes in your PR
4. Link your PR to the issue it resolves
5. Wait for a code review from at least one maintainer
6. Address any feedback from the code review
7. Once approved, your PR will be merged by a maintainer

## Coding Standards

We follow these coding standards:

### JavaScript/TypeScript

- Use ESLint with our configuration
- Follow Airbnb JavaScript Style Guide
- Use async/await for asynchronous code
- Prefer functional programming patterns
- Use PropTypes or TypeScript for component props

### React

- Use functional components with hooks
- Keep components small and focused
- Use Context API for state management
- Follow component file structure conventions

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: kebab-case

### Testing

- Write tests for all new functionality
- Aim for high test coverage
- Test both happy paths and edge cases
- Use meaningful test descriptions

## Documentation

Good documentation is crucial for our project:

- Update README.md with any new features or changes
- Document new components with JSDoc comments
- Add or update relevant documentation in the `/docs` directory
- Include screenshots or diagrams for UI changes where helpful

## Community

- Join our Discord server for real-time discussions
- Participate in weekly developer meetings
- Help answer questions from other contributors
- Share your ideas and feedback

## Recognition

All contributors will be recognized in our CONTRIBUTORS.md file.

Thank you for contributing to LearnConnectLive! 