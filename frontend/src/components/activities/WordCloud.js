import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloudContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  width: 100%;
`;

const WordCloudHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const WordCloudTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const WordCloudDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
`;

const VisualizationContainer = styled.div`
  width: 100%;
  height: 400px;
  position: relative;
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const InputContainer = styled.div`
  display: flex;
  max-width: 500px;
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const WordInput = styled.input`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme, isMobile }) => 
    isMobile 
      ? theme.borderRadius.default 
      : `${theme.borderRadius.default} 0 0 ${theme.borderRadius.default}`};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.borderRadius.default};
  }
`;

const SubmitButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.light};
  border: none;
  border-radius: ${({ theme, isMobile }) => 
    isMobile 
      ? theme.borderRadius.default 
      : `0 ${theme.borderRadius.default} ${theme.borderRadius.default} 0`};
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + 'DD'};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.primary + '80'};
    cursor: not-allowed;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.borderRadius.default};
  }
`;

const InfoText = styled.p`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const TopWordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const WordChip = styled.div`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: ${({ theme }) => theme.fontSizes.small};
  display: flex;
  align-items: center;
  
  span {
    margin-left: ${({ theme }) => theme.spacing.xs};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NoSubmissionsMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.h5};
  text-align: center;
`;

const PresenterControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ControlsInfo = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const ActionButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background-color: ${({ theme, variant }) => 
    variant === 'danger' ? theme.colors.error : theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.light};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, variant }) => 
      variant === 'danger' ? theme.colors.error + 'DD' : theme.colors.primary + 'DD'};
  }
`;

/**
 * WordCloud Component
 * @param {Object} props
 * @param {string} props.id - WordCloud ID
 * @param {string} props.title - WordCloud title 
 * @param {string} props.description - WordCloud description
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {Array} props.words - Array of word objects {text, value}
 * @param {number} props.maxSubmissions - Max submissions per participant
 * @param {function} props.onSubmit - Function called when word is submitted
 * @param {function} props.onReset - Function called when presenter resets the cloud
 */
const WordCloud = ({
  id,
  title = "Word Cloud",
  description = "Submit words that come to mind",
  isPresenter = false,
  words = [],
  maxSubmissions = 3,
  onSubmit,
  onReset
}) => {
  const [inputValue, setInputValue] = useState('');
  const [userSubmissions, setUserSubmissions] = useState(0);
  const [submissionEnabled, setSubmissionEnabled] = useState(true);
  const isMobile = window.innerWidth <= 576;
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Generate the word cloud visualization
  useEffect(() => {
    if (words.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create color scale
    const color = d3.scaleOrdinal()
      .domain([0, words.length])
      .range([
        "#3498db", "#2ecc71", "#9b59b6", "#e67e22", "#f1c40f", 
        "#1abc9c", "#e74c3c", "#34495e", "#16a085", "#d35400"
      ]);
    
    // Configure the layout
    const layout = cloud()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => Math.random() > 0.5 ? 0 : 90)
      .font("Impact")
      .fontSize(d => Math.sqrt(d.value) * 5)
      .on("end", draw);
    
    // Start the layout
    layout.start();
    
    // Draw the word cloud
    function draw(words) {
      d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Impact")
        .style("fill", (d, i) => color(i))
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text);
    }
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current) {
        layout.size([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        ]).start();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [words]);
  
  // Check if user can submit more words
  useEffect(() => {
    setSubmissionEnabled(userSubmissions < maxSubmissions);
  }, [userSubmissions, maxSubmissions]);
  
  // Handle word submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const word = inputValue.trim();
    
    if (word && submissionEnabled) {
      if (onSubmit) {
        onSubmit(id, word);
      }
      
      setUserSubmissions(prev => prev + 1);
      setInputValue('');
    }
  };
  
  // Handle reset (presenter only)
  const handleReset = () => {
    if (onReset) {
      onReset(id);
    }
  };
  
  // Get top 10 words
  const topWords = [...words]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  return (
    <WordCloudContainer>
      <WordCloudHeader>
        <WordCloudTitle>{title}</WordCloudTitle>
        <WordCloudDescription>{description}</WordCloudDescription>
      </WordCloudHeader>
      
      <VisualizationContainer ref={containerRef}>
        {words.length > 0 ? (
          <svg ref={svgRef} width="100%" height="100%" />
        ) : (
          <NoSubmissionsMessage>
            No words submitted yet. Be the first to contribute!
          </NoSubmissionsMessage>
        )}
      </VisualizationContainer>
      
      {!isPresenter && (
        <>
          <form onSubmit={handleSubmit}>
            <InputContainer>
              <WordInput
                type="text"
                placeholder="Enter a word..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!submissionEnabled}
                isMobile={isMobile}
                maxLength={20}
              />
              <SubmitButton 
                type="submit" 
                disabled={!inputValue.trim() || !submissionEnabled}
                isMobile={isMobile}
              >
                Submit
              </SubmitButton>
            </InputContainer>
          </form>
          
          <InfoText>
            {userSubmissions} of {maxSubmissions} submissions made
          </InfoText>
        </>
      )}
      
      {words.length > 0 && (
        <div>
          <InfoText>Top Words</InfoText>
          <TopWordsContainer>
            {topWords.map((word, index) => (
              <WordChip key={index}>
                {word.text} <span>{word.value}</span>
              </WordChip>
            ))}
          </TopWordsContainer>
        </div>
      )}
      
      {isPresenter && (
        <PresenterControls>
          <ControlsInfo>
            {/* Show total number of words submitted (sum of all values) */}
            {words.reduce((sum, w) => sum + (w.value || 0), 0)} words submitted by participants
          </ControlsInfo>
          <ActionButton variant="danger" onClick={handleReset}>
            Reset Word Cloud
          </ActionButton>
        </PresenterControls>
      )}
    </WordCloudContainer>
  );
};

export default WordCloud;