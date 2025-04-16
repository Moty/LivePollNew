import React from 'react';
import styled from 'styled-components';

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ControlsTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    margin-right: 4px;
    font-size: 16px;
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const ControlsForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
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

const FormInput = styled.input`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FormSelect = styled.select`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

// Animation easing functions available in Chart.js
const EASING_FUNCTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeInQuad', label: 'Ease In Quad' },
  { value: 'easeOutQuad', label: 'Ease Out Quad' },
  { value: 'easeInOutQuad', label: 'Ease In Out Quad' },
  { value: 'easeInCubic', label: 'Ease In Cubic' },
  { value: 'easeOutCubic', label: 'Ease Out Cubic' },
  { value: 'easeInOutCubic', label: 'Ease In Out Cubic' },
  { value: 'easeInQuart', label: 'Ease In Quart' },
  { value: 'easeOutQuart', label: 'Ease Out Quart' },
  { value: 'easeInOutQuart', label: 'Ease In Out Quart' },
  { value: 'easeInSine', label: 'Ease In Sine' },
  { value: 'easeOutSine', label: 'Ease Out Sine' },
  { value: 'easeInOutSine', label: 'Ease In Out Sine' },
  { value: 'easeInExpo', label: 'Ease In Expo' },
  { value: 'easeOutExpo', label: 'Ease Out Expo' },
  { value: 'easeInOutExpo', label: 'Ease In Out Expo' },
];

/**
 * Animation Controls Component
 * Allows users to customize chart animation settings
 * 
 * @param {Object} props
 * @param {Object} props.animation - Current animation settings
 * @param {function} props.onChange - Function called when animation settings change
 */
const AnimationControls = ({ 
  animation = { duration: 1000, easing: 'easeOutQuad', delay: 0 },
  onChange 
}) => {
  const handleChange = (key, value) => {
    if (onChange) {
      onChange({
        ...animation,
        [key]: key === 'duration' || key === 'delay' ? parseInt(value, 10) : value
      });
    }
  };
  
  return (
    <ControlsContainer data-testid="animation-controls">
      <ControlsTitle>
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Animation Settings
      </ControlsTitle>
      <ControlsForm>
        <FormGroup>
          <FormLabel htmlFor="animation-duration">Animation Duration</FormLabel>
          <FormInput
            id="animation-duration"
            type="number"
            min="0"
            max="5000"
            step="100"
            value={animation.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
          />
        </FormGroup>
        
        <FormGroup>
          <FormLabel htmlFor="animation-easing">Easing Function</FormLabel>
          <FormSelect
            id="animation-easing"
            value={animation.easing}
            onChange={(e) => handleChange('easing', e.target.value)}
          >
            {EASING_FUNCTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FormSelect>
        </FormGroup>
        
        <FormGroup>
          <FormLabel htmlFor="animation-delay">Delay (ms)</FormLabel>
          <FormInput
            id="animation-delay"
            type="number"
            min="0"
            max="2000"
            step="100"
            value={animation.delay}
            onChange={(e) => handleChange('delay', e.target.value)}
          />
        </FormGroup>
      </ControlsForm>
    </ControlsContainer>
  );
};

export default AnimationControls; 