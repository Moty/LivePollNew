import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  Bar,
  Pie,
  Doughnut,
  Line
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

import ChartTypeSelector from './ChartTypeSelector';
import ColorSchemeSelector, { COLOR_SCHEMES } from './ColorSchemeSelector';
import AnimationControls from './AnimationControls';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PollContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  width: 100%;
`;

const PollQuestion = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const OptionButton = styled.button`
  background-color: ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.background.secondary};
  color: ${({ theme, selected }) => 
    selected ? theme.colors.text.light : theme.colors.text.primary};
  border: ${({ theme, selected }) => 
    selected ? 'none' : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.body};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, selected }) => 
      selected ? theme.colors.primary : theme.colors.background.secondary + 'DD'};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.light};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-size: ${({ theme }) => theme.fontSizes.body};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin: 0 auto;
  display: block;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + 'DD'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const VisualizationControls = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
`;

const VisualizationControlsToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary + 'DD'};
  }
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  position: relative;
`;

const ParticipantCount = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const PreviewButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text.light};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing.md};
  display: block;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary + 'DD'};
  }
`;

/**
 * Poll Component
 * @param {Object} props
 * @param {string} props.id - Poll ID
 * @param {string} props.question - Poll question
 * @param {Array} props.options - Poll options
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {boolean} props.showResults - Whether to show results
 * @param {Array} props.results - Poll results (if available)
 * @param {string} props.chartType - Chart type to display results (bar, pie, doughnut, horizontalBar)
 * @param {Object} props.colorScheme - Custom color scheme for the chart
 * @param {Object} props.animation - Animation settings for the chart
 * @param {function} props.onVote - Function called when a vote is submitted
 */
const Poll = ({
  id,
  question,
  options = [],
  isPresenter = false,
  showResults = false,
  results = null,
  chartType: initialChartType = 'bar',
  colorScheme: initialColorScheme = 'default',
  animation: initialAnimation = { duration: 1000, easing: 'easeOutQuad', delay: 0 },
  onVote,
  onSettingsChange
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [chartType, setChartType] = useState(initialChartType);
  const [colorScheme, setColorScheme] = useState(initialColorScheme);
  const [animation, setAnimation] = useState(initialAnimation);
  const [showControls, setShowControls] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const chartRef = useRef(null);
  
  // If results are provided, use them; otherwise create empty results
  const pollResults = results || options.map((option, index) => ({
    option,
    votes: 0
  }));
  
  const totalVotes = pollResults.reduce((sum, item) => sum + item.votes, 0);
  
  useEffect(() => {
    // If results change and we're not the presenter, mark as voted
    if (results && !isPresenter) {
      setHasVoted(true);
    }
  }, [results, isPresenter]);
  
  const handleOptionSelect = (index) => {
    setSelectedOption(index);
  };
  
  const handleSubmit = () => {
    if (selectedOption !== null) {
      setHasVoted(true);
      
      if (onVote) {
        onVote({
          pollId: id,
          optionIndex: selectedOption
        });
      }
      
      // Create local results before server response
      const newResults = [...pollResults];
      if (newResults[selectedOption]) {
        newResults[selectedOption] = {
          ...newResults[selectedOption],
          votes: newResults[selectedOption].votes + 1
        };
      }
    }
  };
  
  const handleChartTypeChange = (type) => {
    setChartType(type);
    
    if (onSettingsChange) {
      onSettingsChange({
        chartType: type,
        colorScheme,
        animation
      });
    }
  };
  
  const handleColorSchemeChange = (scheme) => {
    setColorScheme(scheme);
    
    if (onSettingsChange) {
      onSettingsChange({
        chartType,
        colorScheme: scheme,
        animation
      });
    }
  };
  
  const handleAnimationChange = (newAnimation) => {
    setAnimation(newAnimation);
    
    if (onSettingsChange) {
      onSettingsChange({
        chartType,
        colorScheme,
        animation: newAnimation
      });
    }
  };

  const handlePreviewAnimation = () => {
    if (chartRef.current) {
      setIsAnimating(true);
      chartRef.current.update();
      setTimeout(() => {
        setIsAnimating(false);
      }, animation.duration + animation.delay + 100);
    }
  };
  
  // Get the current color scheme
  const currentColors = typeof colorScheme === 'string'
    ? COLOR_SCHEMES[colorScheme]
    : colorScheme;
  
  // Prepare chart data
  const chartData = {
    labels: pollResults.map(item => item.option),
    datasets: [
      {
        label: 'Votes',
        data: pollResults.map(item => item.votes),
        backgroundColor: currentColors?.backgroundColor || COLOR_SCHEMES.default.backgroundColor,
        borderColor: currentColors?.borderColor || COLOR_SCHEMES.default.borderColor,
        borderWidth: 1,
        // Add tension for line chart
        tension: 0.3,
        // Add point styling for line chart
        pointBackgroundColor: currentColors?.backgroundColor || COLOR_SCHEMES.default.backgroundColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
    ],
  };

  // Chart options with animation settings
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'line' ? {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: chartType === 'horizontalBar' ? 0 : 45,
          minRotation: 0
        }
      }
    } : undefined,
    indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
    plugins: {
      legend: {
        display: chartType === 'pie' || chartType === 'doughnut',
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = totalVotes > 0 
              ? Math.round((value / totalVotes) * 100) 
              : 0;
            return `${value} votes (${percentage}%)`;
          }
        }
      }
    },
    animation: isAnimating ? {
      duration: animation.duration,
      easing: animation.easing,
      delay: animation.delay
    } : false
  };
  
  // Render the appropriate chart based on chartType
  const renderChart = () => {
    switch(chartType) {
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
      case 'horizontalBar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'bar':
      default:
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
    }
  };
  
  return (
    <PollContainer>
      <PollQuestion>{question}</PollQuestion>
      
      {(!hasVoted && !isPresenter) ? (
        <>
          <OptionsGrid>
            {options.map((option, index) => (
              <OptionButton
                key={index}
                selected={selectedOption === index}
                onClick={() => handleOptionSelect(index)}
              >
                {option}
              </OptionButton>
            ))}
          </OptionsGrid>
          
          <SubmitButton 
            onClick={handleSubmit} 
            disabled={selectedOption === null}
          >
            Submit Vote
          </SubmitButton>
        </>
      ) : (
        (hasVoted || showResults || isPresenter) && (
          <ResultsContainer>
            <ChartContainer>
              {renderChart()}
            </ChartContainer>
            
            <ParticipantCount>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
            </ParticipantCount>
            
            {(isPresenter || showResults) && (
              <>
                <VisualizationControlsToggle
                  onClick={() => setShowControls(!showControls)}
                >
                  {showControls ? 'Hide Visualization Controls' : 'Show Visualization Controls'}
                </VisualizationControlsToggle>
                
                {showControls && (
                  <VisualizationControls>
                    <ChartTypeSelector 
                      selectedType={chartType} 
                      onChange={handleChartTypeChange}
                    />
                    
                    <ColorSchemeSelector 
                      selectedScheme={colorScheme}
                      onChange={handleColorSchemeChange}
                    />
                    
                    <AnimationControls 
                      animation={animation}
                      onChange={handleAnimationChange}
                    />
                    
                    <PreviewButton onClick={handlePreviewAnimation}>
                      Preview Animation
                    </PreviewButton>
                  </VisualizationControls>
                )}
              </>
            )}
          </ResultsContainer>
        )
      )}
    </PollContainer>
  );
};

export default Poll;