# LearnConnectLive Testing Guide

This guide outlines the testing approach used in the LearnConnectLive project, including Test-Driven Development (TDD) methodology, testing tools, and best practices.

## Testing Philosophy

The LearnConnectLive project follows a Test-Driven Development (TDD) approach, which means:

1. **Write tests first**: Before implementing a new feature, we write tests that define the expected behavior.
2. **Run tests to see them fail**: Verify that the tests fail as expected without the implementation.
3. **Implement the feature**: Write the minimum code required to make the tests pass.
4. **Run tests to see them pass**: Verify that the implementation satisfies the tests.
5. **Refactor**: Clean up the code while ensuring tests continue to pass.

This approach ensures that:
- Every feature has test coverage
- Implementation meets the defined requirements
- Regressions are caught early
- Code quality is maintained through refactoring

## Test Categories

### Unit Tests

Unit tests focus on testing individual components, functions, or classes in isolation. They verify that each unit of code works as expected independently of other units.

**Example**: Testing that the `ChartTypeSelector` component renders all chart type options and calls the correct handler when an option is selected.

### Integration Tests

Integration tests verify that different units of code work together correctly. They test the interactions between components, services, and external dependencies.

**Example**: Testing that the Poll component correctly integrates with the Socket.IO service to send vote data and receive updates.

### End-to-End Tests

End-to-End (E2E) tests simulate real user scenarios by testing the application from start to finish. They verify that the entire system works as expected from a user's perspective.

**Example**: Testing that a presenter can create a session, start a poll, and that participants can join and submit votes, with results displaying correctly.

## Testing Tools

### Frontend Testing

- **Jest**: JavaScript testing framework for unit and integration tests
- **React Testing Library**: Library for testing React components
- **Mock Service Worker**: For mocking API requests
- **@testing-library/user-event**: For simulating user interactions

### Backend Testing

- **Jest**: For unit and integration tests
- **Supertest**: For testing HTTP endpoints
- **socket.io-client-mock**: For mocking Socket.IO client connections

### End-to-End Testing

- **Cypress**: For end-to-end browser testing
- **Playwright**: For testing in multiple browsers and devices

## TDD Workflow Example

Let's walk through a TDD workflow example for implementing the Chart Type Selector feature:

### 1. Write the Test First

```javascript
// ChartTypeSelector.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ChartTypeSelector from '../ChartTypeSelector';

// Sample theme object...

describe('ChartTypeSelector', () => {
  test('renders all chart type options', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartTypeSelector selectedType="bar" onChange={() => {}} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Pie')).toBeInTheDocument();
    expect(screen.getByText('Doughnut')).toBeInTheDocument();
    expect(screen.getByText('Horizontal Bar')).toBeInTheDocument();
  });
  
  test('calls onChange when a chart type is selected', () => {
    const handleChange = jest.fn();
    render(
      <ThemeProvider theme={theme}>
        <ChartTypeSelector selectedType="bar" onChange={handleChange} />
      </ThemeProvider>
    );
    
    fireEvent.click(screen.getByText('Pie'));
    
    expect(handleChange).toHaveBeenCalledWith('pie');
  });
  
  test('highlights the selected chart type', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartTypeSelector selectedType="pie" onChange={() => {}} />
      </ThemeProvider>
    );
    
    const pieButton = screen.getByText('Pie').closest('button');
    const barButton = screen.getByText('Bar').closest('button');
    
    expect(pieButton).toHaveAttribute('selected', 'true');
    expect(barButton).not.toHaveAttribute('selected', 'true');
  });
});
```

### 2. Run the Tests to See Them Fail

At this point, running the tests will fail because we haven't implemented the component yet.

### 3. Implement the Component

```javascript
// ChartTypeSelector.js
import React from 'react';
import styled from 'styled-components';
import { /* icons */ } from '@material-ui/icons';

// Styled components...

const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: BarChartIcon },
  { id: 'pie', label: 'Pie', icon: PieChartIcon },
  { id: 'doughnut', label: 'Doughnut', icon: DonutIcon },
  { id: 'horizontalBar', label: 'Horizontal Bar', icon: HorizontalBarIcon }
];

const ChartTypeSelector = ({ selectedType = 'bar', onChange }) => {
  const handleSelectType = (type) => {
    if (onChange) {
      onChange(type);
    }
  };
  
  return (
    <SelectorContainer data-testid="chart-type-selector">
      {CHART_TYPES.map(({ id, label, icon: Icon }) => (
        <ChartTypeButton
          key={id}
          selected={selectedType === id}
          onClick={() => handleSelectType(id)}
        >
          <Icon />
          <ChartTypeLabel>{label}</ChartTypeLabel>
        </ChartTypeButton>
      ))}
    </SelectorContainer>
  );
};

export default ChartTypeSelector;
```

### 4. Run Tests to See Them Pass

After implementing the component, the tests should pass, confirming that the implementation meets the requirements.

### 5. Refactor (if needed)

With passing tests, we can now refactor the code for improved readability, performance, or maintainability without changing its behavior.

## Testing Patterns

### Component Testing Pattern

When testing React components, follow this pattern:

1. **Props and rendering**: Test that the component renders correctly with different props
2. **User interactions**: Test that the component responds correctly to user interactions
3. **State changes**: Test that the component's state changes as expected
4. **Side effects**: Test that the component triggers the expected side effects

Example:
```javascript
describe('Poll Component', () => {
  // Props and rendering
  test('renders poll question', () => {
    renderPoll({ question: 'What is your favorite color?' });
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });
  
  // User interactions
  test('allows selecting an option and submitting vote', () => {
    const onVoteMock = jest.fn();
    renderPoll({ onVote: onVoteMock });
    
    fireEvent.click(screen.getByText('Blue'));
    fireEvent.click(screen.getByText('Submit Vote'));
    
    expect(onVoteMock).toHaveBeenCalledWith('poll-123', 1);
  });
  
  // State changes
  test('disables options after voting', () => {
    renderPoll();
    
    fireEvent.click(screen.getByText('Blue'));
    fireEvent.click(screen.getByText('Submit Vote'));
    
    // Options should be disabled now
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument();
  });
  
  // Side effects
  test('shows results after voting', async () => {
    renderPoll();
    
    fireEvent.click(screen.getByText('Blue'));
    fireEvent.click(screen.getByText('Submit Vote'));
    
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});
```

### API Testing Pattern

When testing API endpoints, follow this pattern:

1. **Valid requests**: Test that valid requests return the expected response
2. **Invalid requests**: Test that invalid requests return appropriate errors
3. **Authentication/Authorization**: Test that protected endpoints require authentication
4. **Edge cases**: Test boundary conditions and edge cases

Example:
```javascript
describe('Presentation API', () => {
  // Valid requests
  test('GET /api/presentations returns list of presentations', async () => {
    const response = await request(app).get('/api/presentations');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
  
  // Invalid requests
  test('GET /api/presentations/:id returns 404 for non-existent presentation', async () => {
    const response = await request(app).get('/api/presentations/999999');
    expect(response.status).toBe(404);
  });
  
  // Authentication
  test('POST /api/presentations requires authentication', async () => {
    const response = await request(app).post('/api/presentations').send({
      title: 'New Presentation'
    });
    expect(response.status).toBe(401);
  });
  
  // Edge cases
  test('GET /api/presentations handles special characters in query params', async () => {
    const response = await request(app).get('/api/presentations?search=%$#@!');
    expect(response.status).toBe(200);
  });
});
```

## Socket.IO Testing

Testing Socket.IO communication requires special handling:

### 1. Mock Socket Setup

```javascript
import { createMockSocket } from '../test-utils/socket-mock';

describe('Socket.IO Service', () => {
  let mockSocket;
  let mockIO;
  
  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIO = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };
  });
  
  test('handles join-session event', () => {
    mockSocket.emit('join-session', { sessionCode: 'ABC123' });
    
    // Assert the expected behavior
  });
});
```

### 2. Socket Event Testing

For real Socket.IO integration testing, use the Socket.IO Testing utility:

```bash
# Start the application
npm run dev:full

# Open the socket testing utility
# http://localhost:3000/test/realsocket
```

The Socket.IO Testing utility provides a UI for testing socket events between presenter and participant views in real-time.

## Test Coverage

We aim for high test coverage, but focus on meaningful coverage rather than just numbers:

- **Unit Tests**: Aim for 80%+ coverage
- **Integration Tests**: Cover all critical paths
- **E2E Tests**: Cover main user flows

To check test coverage:

```bash
# Frontend test coverage
cd frontend
npm test -- --coverage

# Backend test coverage
cd backend
npm test -- --coverage
```

## Continuous Integration

All tests are run automatically in the CI/CD pipeline:

1. **Pull Requests**: All tests must pass before merging
2. **Main Branch**: Full test suite runs after each merge
3. **Deployments**: Tests must pass before deploying to staging/production

## Writing Testable Code

To make testing easier, follow these guidelines:

1. **Keep components small and focused**: Components should do one thing well
2. **Separate concerns**: Logic, UI, and side effects should be separated
3. **Dependency injection**: Pass dependencies as props rather than importing them directly
4. **Avoid direct DOM manipulation**: Use React's declarative approach
5. **Use meaningful data-testid attributes**: For components that are hard to select otherwise

## Debugging Tests

When tests fail, follow these steps to debug:

1. **Read the error message**: Understand what assertion failed and why
2. **Check the component's rendered output**: Use `screen.debug()` to see the rendered HTML
3. **Check props and state**: Log or debug props and state values
4. **Step through the test**: Use the debugger statement to pause execution
5. **Isolate the problem**: Comment out parts of the test to narrow down the issue

Example:
```javascript
test('component renders correctly', () => {
  render(<MyComponent />);
  
  // Debug the rendered output
  screen.debug();
  
  // Set a breakpoint
  debugger;
  
  // Check what's in the document
  console.log(document.body.innerHTML);
});
```

## Mocking Dependencies

### API Mocking

```javascript
// Setup MSW to intercept API requests
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/presentations', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, title: 'Test Presentation' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Mocking

```javascript
// Mock a child component
jest.mock('../ChildComponent', () => {
  return function MockedChildComponent(props) {
    return <div data-testid="mocked-child" data-props={JSON.stringify(props)} />;
  };
});
```

## Conclusion

By following this Test-Driven Development approach, we ensure that the LearnConnectLive platform maintains high quality, meets requirements, and remains maintainable as it evolves.

For any questions or issues related to testing, please reach out to the development team or create an issue in the repository. 