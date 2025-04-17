import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

import WordCloudColorSchemeSelector, { WORD_CLOUD_COLOR_SCHEMES } from './WordCloudColorSchemeSelector';
import WordCloudShapeSelector, { WORD_CLOUD_SHAPES } from './WordCloudShapeSelector';
import { 
  isAppropriateWordForSubmission,
  getInappropriateWordMessage,
  filterInappropriateWords 
} from '../../utils/wordCloudFilters';
import SettingsIcon from '../icons/SettingsIcon';

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
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, variant }) => 
      variant === 'danger' ? theme.colors.error + 'DD' : theme.colors.primary + 'DD'};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.small};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const VisualizationSettings = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
`;

const VisualizationSettingsTitle = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.body};
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const VisualizationSettingsToggle = styled.button`
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
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
`;

const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FormCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const FormCheckbox = styled.input`
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const FilterSettingsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

/**
 * WordCloud Component
 * @param {Object} props
 * @param {string} props.id - WordCloud ID
 * @param {string} props.title - WordCloud title 
 * @param {string} props.description - WordCloud description
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {string} props.mode - Mode of the word cloud: 'edit' or 'present'
 * @param {Array} props.words - Array of word objects with text and value properties
 * @param {number} props.maxSubmissions - Maximum number of words a user can submit
 * @param {Object} props.visualSettings - Visual settings for the word cloud
 * @param {function} props.onSubmit - Function called when a word is submitted
 * @param {function} props.onReset - Function called when the word cloud is reset
 * @param {function} props.onSettingsChange - Function called when visual settings change
 */
const WordCloud = ({
  id,
  title = "Word Cloud",
  description = "Submit words that come to mind",
  isPresenter = false,
  mode = 'present', // 'edit' or 'present'
  words = [],
  maxSubmissions = 3,
  visualSettings: initialVisualSettings = {
    colorScheme: 'default',
    shape: 'rectangle',
    filterInappropriateWords: true,
    filterFillerWords: false,
    customFilterList: []
  },
  onSubmit,
  onReset,
  onSettingsChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [userSubmissions, setUserSubmissions] = useState(0);
  const [submissionEnabled, setSubmissionEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [visualSettings, setVisualSettings] = useState(initialVisualSettings);
  const [showSettings, setShowSettings] = useState(mode === 'edit');
  const [customFilterInput, setCustomFilterInput] = useState('');

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Apply filtering to words based on settings
  const filteredWords = visualSettings.filterInappropriateWords 
    ? filterInappropriateWords(
        words, 
        visualSettings.customFilterList, 
        true, 
        visualSettings.filterFillerWords
      )
    : words;

  // Draw the word cloud whenever the container size, words, or visual settings change
  useEffect(() => {
    if (!containerRef.current || filteredWords.length === 0) return;

    // Clear previous word cloud
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Get colors based on selected color scheme
    const colorScheme = WORD_CLOUD_COLOR_SCHEMES[visualSettings.colorScheme] || WORD_CLOUD_COLOR_SCHEMES.default;
    const colors = colorScheme.colors;
    const color = d3.scaleOrdinal(colors);

    // Find the word with maximum frequency to normalize sizes
    const maxSize = Math.max(...filteredWords.map(w => w.value));
    const minSize = Math.min(...filteredWords.map(w => w.value));
    const sizeScale = d3.scaleLinear()
      .domain([minSize, maxSize])
      .range([15, 60]);

    // Create cloud layout
    const layout = cloud()
      .size([width, height])
      .words(filteredWords.map(w => ({
        text: w.text,
        size: sizeScale(w.value)
      })))
      .padding(5)
      .rotate(() => 0)
      .fontSize(d => d.size)
      .on("end", draw);

    // Apply shape constraints if selected
    const shape = WORD_CLOUD_SHAPES[visualSettings.shape];
    if (shape && shape.getPolygon) {
      const polygon = shape.getPolygon(Math.min(width, height));
      layout.polygon(polygon);
    }

    layout.start();

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
        .style("fill", (d, i) => color(i % colors.length))
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
  }, [filteredWords, visualSettings]);

  // Check if user can submit more words
  useEffect(() => {
    setSubmissionEnabled(userSubmissions < maxSubmissions);
  }, [userSubmissions, maxSubmissions]);

  // Handle visual settings change
  const handleVisualSettingChange = (key, value) => {
    const newSettings = {
      ...visualSettings,
      [key]: value
    };

    setVisualSettings(newSettings);

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // Add custom filter word
  const handleAddCustomFilter = () => {
    if (customFilterInput.trim()) {
      const newFilterList = [...visualSettings.customFilterList, customFilterInput.trim()];
      handleVisualSettingChange('customFilterList', newFilterList);
      setCustomFilterInput('');
    }
  };

  // Remove custom filter word
  const handleRemoveCustomFilter = (word) => {
    const newFilterList = visualSettings.customFilterList.filter(w => w !== word);
    handleVisualSettingChange('customFilterList', newFilterList);
  };

  // Handle word submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const word = inputValue.trim();

    if (!word) {
      setErrorMessage('Please enter a word.');
      return;
    }

    if (word.length > 20) {
      setErrorMessage('Word must be 20 characters or less.');
      return;
    }

    if (!submissionEnabled) {
      setErrorMessage(`You've reached the maximum of ${maxSubmissions} submissions.`);
      return;
    }

    // Check for inappropriate words if filtering is enabled
    if (visualSettings.filterInappropriateWords && !isAppropriateWordForSubmission(
      word,
      visualSettings.customFilterList,
      true
    )) {
      setErrorMessage(getInappropriateWordMessage(word));
      return;
    }

    setErrorMessage('');

    if (onSubmit) {
      onSubmit(id, word);
    }

    setUserSubmissions(prev => prev + 1);
    setInputValue('');
  };

  // Handle reset (presenter only)
  const handleReset = () => {
    if (onReset) {
      onReset(id);
    }
  };

  // Get top 10 words
  const topWords = [...filteredWords]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <WordCloudContainer>
      <WordCloudHeader>
        <WordCloudTitle>{title}</WordCloudTitle>
        <WordCloudDescription>{description}</WordCloudDescription>
      </WordCloudHeader>

      <VisualizationContainer ref={containerRef}>
        {filteredWords.length > 0 ? (
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

          {errorMessage && (
            <ErrorMessage>{errorMessage}</ErrorMessage>
          )}

          <InfoText>
            {userSubmissions} of {maxSubmissions} submissions made
          </InfoText>
        </>
      )}

      {filteredWords.length > 0 && (
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
        <>
          {/* Only show the settings toggle and settings during edit mode */}
          {mode === 'edit' && (
            <>
              <VisualizationSettingsToggle
                onClick={() => setShowSettings(!showSettings)}
              >
                <SettingsIcon />
                {showSettings ? 'Hide Visualization Settings' : 'Show Visualization Settings'}
              </VisualizationSettingsToggle>

              {showSettings && (
                <VisualizationSettings>
                  <VisualizationSettingsTitle>
                    <SettingsIcon />
                    Word Cloud Settings
                  </VisualizationSettingsTitle>

                  <WordCloudColorSchemeSelector
                    selectedScheme={visualSettings.colorScheme}
                    onChange={(scheme) => handleVisualSettingChange('colorScheme', scheme)}
                  />

                  <WordCloudShapeSelector
                    selectedShape={visualSettings.shape}
                    onChange={(shape) => handleVisualSettingChange('shape', shape)}
                  />

                  <FilterSettingsContainer>
                    <FormGroup>
                      <FormLabel>Word Filtering</FormLabel>
                      <FormCheckboxContainer>
                        <FormCheckbox
                          type="checkbox"
                          id="filter-inappropriate"
                          checked={visualSettings.filterInappropriateWords}
                          onChange={(e) => handleVisualSettingChange('filterInappropriateWords', e.target.checked)}
                        />
                        <FormLabel htmlFor="filter-inappropriate">Filter inappropriate words</FormLabel>
                      </FormCheckboxContainer>
                      <FormCheckboxContainer>
                        <FormCheckbox
                          type="checkbox"
                          id="filter-filler"
                          checked={visualSettings.filterFillerWords}
                          onChange={(e) => handleVisualSettingChange('filterFillerWords', e.target.checked)}
                        />
                        <FormLabel htmlFor="filter-filler">Filter common filler words</FormLabel>
                      </FormCheckboxContainer>
                    </FormGroup>

                    {visualSettings.filterInappropriateWords && (
                      <FormGroup>
                        <FormLabel>Custom Filter Words</FormLabel>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <WordInput
                            type="text"
                            placeholder="Add word to filter..."
                            value={customFilterInput}
                            onChange={(e) => setCustomFilterInput(e.target.value)}
                            style={{ minWidth: '150px' }}
                          />
                          <ActionButton
                            type="button"
                            onClick={handleAddCustomFilter}
                            disabled={!customFilterInput.trim()}
                          >
                            Add
                          </ActionButton>
                        </div>
                        {visualSettings.customFilterList.length > 0 && (
                          <TopWordsContainer>
                            {visualSettings.customFilterList.map((word, index) => (
                              <WordChip key={index} onClick={() => handleRemoveCustomFilter(word)}>
                                {word} ✕
                              </WordChip>
                            ))}
                          </TopWordsContainer>
                        )}
                      </FormGroup>
                    )}
                  </FilterSettingsContainer>
                </VisualizationSettings>
              )}
            </>
          )}

          <PresenterControls>
            <ControlsInfo>
              {/* Show total number of words submitted (sum of all values) */}
              {words.reduce((sum, w) => sum + (w.value || 0), 0)} words submitted by participants
              {filteredWords.length < words.length && (
                <div>({words.length - filteredWords.length} words filtered)</div>
              )}
            </ControlsInfo>
            <ActionButton variant="danger" onClick={handleReset}>
              Reset Word Cloud
            </ActionButton>
          </PresenterControls>
        </>
      )}
    </WordCloudContainer>
  );
};

export default WordCloud;