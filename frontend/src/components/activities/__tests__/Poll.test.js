import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import Poll from '../Poll';

// Mock theme for styled-components
const theme = {
  colors: {
    primary: '#4285F4',
    secondary: '#34A853',
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5'
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
      light: '#FFFFFF'
    },
    border: '#DADCE0'
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    default: '8px'
  },
  shadows: {
    default: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  fontSizes: {
    small: '12px',
    body: '14px',
    subtitle: '16px',
    title: '20px'
  },
  transitions: {
    fast: '0.2s'
  }
};

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-options={JSON.stringify(options)} data-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  Pie: ({ data, options }) => (
    <div data-testid="pie-chart" data-options={JSON.stringify(options)} data-data={JSON.stringify(data)}>
      Pie Chart
    </div>
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-options={JSON.stringify(options)} data-data={JSON.stringify(data)}>
      Doughnut Chart
    </div>
  ),
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-options={JSON.stringify(options)} data-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  HorizontalBar: ({ data, options }) => (
    <div data-testid="horizontal-bar-chart" data-options={JSON.stringify(options)} data-data={JSON.stringify(data)}>
      Horizontal Bar Chart
    </div>
  )
}));

// Sample poll data for tests
const samplePollData = {
  id: 'poll-123',
  question: 'What is your favorite color?',
  options: ['Red', 'Blue', 'Green', 'Yellow'],
  results: [
    { option: 'Red', votes: 5 },
    { option: 'Blue', votes: 10 },
    { option: 'Green', votes: 3 },
    { option: 'Yellow', votes: 7 }
  ]
};

const renderPoll = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <Poll
        id={samplePollData.id}
        question={samplePollData.question}
        options={samplePollData.options}
        results={samplePollData.results}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('Poll Component', () => {
  // Test existing functionality
  test('renders poll question', () => {
    renderPoll();
    expect(screen.getByText(samplePollData.question)).toBeInTheDocument();
  });

  test('shows options when not voted yet', () => {
    renderPoll({ isPresenter: false, showResults: false, results: null });
    
    samplePollData.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  test('allows selecting an option and submitting vote', async () => {
    const onVoteMock = jest.fn();
    renderPoll({ 
      isPresenter: false, 
      showResults: false, 
      results: null,
      onVote: onVoteMock 
    });
    
    // Select an option
    fireEvent.click(screen.getByText('Blue'));
    
    // Submit vote
    fireEvent.click(screen.getByText('Submit Vote'));
    
    expect(onVoteMock).toHaveBeenCalledWith('poll-123', 1);
  });

  test('shows results for presenter', () => {
    renderPoll({ isPresenter: true });
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('25 votes cast')).toBeInTheDocument();
  });

  // Test new functionality (TDD)
  describe('Enhanced Visualization Features', () => {
    test('renders bar chart by default', () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
    
    test('changes chart type when selected', async () => {
      renderPoll({ 
        isPresenter: true, 
        showResults: true,
        chartType: 'pie' 
      });
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
    
    test('displays chart type selector for presenter', () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      expect(screen.getByTestId('chart-type-selector')).toBeInTheDocument();
      
      const selector = screen.getByTestId('chart-type-selector');
      expect(selector).toContainElement(screen.getByText('Bar'));
      expect(selector).toContainElement(screen.getByText('Pie'));
      expect(selector).toContainElement(screen.getByText('Doughnut'));
      expect(selector).toContainElement(screen.getByText('Horizontal Bar'));
    });
    
    test('changes chart type when selector is used', async () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      // Initial state should be bar chart
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      
      // Change to pie chart
      fireEvent.click(screen.getByText('Pie'));
      
      // Should now show pie chart
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });
    
    test('applies custom color scheme when provided', () => {
      const customColors = {
        backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33'],
        borderColor: ['#CC4522', '#22CC44', '#2244CC', '#C2CC22']
      };
      
      renderPoll({ 
        isPresenter: true, 
        showResults: true,
        colorScheme: customColors
      });
      
      const chart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(chart.getAttribute('data-data'));
      
      expect(chartData.datasets[0].backgroundColor).toEqual(customColors.backgroundColor);
      expect(chartData.datasets[0].borderColor).toEqual(customColors.borderColor);
    });
    
    test('provides color scheme selector for presenter', () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      expect(screen.getByTestId('color-scheme-selector')).toBeInTheDocument();
    });
    
    test('changes color scheme when selector is used', async () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      // Change color scheme
      fireEvent.click(screen.getByText('Vibrant'));
      
      // Should update chart colors
      const chart = await screen.findByTestId('bar-chart');
      const chartData = JSON.parse(chart.getAttribute('data-data'));
      
      // Should match the vibrant color scheme
      expect(chartData.datasets[0].backgroundColor[0]).toContain('rgba(255,');
    });
    
    test('applies animation options when provided', () => {
      const animationOptions = {
        duration: 2000,
        easing: 'easeOutBounce'
      };
      
      renderPoll({ 
        isPresenter: true, 
        showResults: true,
        animation: animationOptions
      });
      
      const chart = screen.getByTestId('bar-chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-options'));
      
      expect(chartOptions.animation.duration).toBe(2000);
      expect(chartOptions.animation.easing).toBe('easeOutBounce');
    });
    
    test('animation controls are available for presenter', () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      expect(screen.getByTestId('animation-controls')).toBeInTheDocument();
    });
    
    test('updates animation settings when controls are adjusted', async () => {
      renderPoll({ isPresenter: true, showResults: true });
      
      // Change animation duration
      fireEvent.change(screen.getByLabelText('Animation Duration'), {
        target: { value: '2000' }
      });
      
      // Should update chart options
      const chart = await screen.findByTestId('bar-chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-options'));
      
      expect(chartOptions.animation.duration).toBe(2000);
    });
  });
}); 