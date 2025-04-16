import React from 'react';
import styled from 'styled-components';
import PaletteIcon from '../icons/PaletteIcon';

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SelectorTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    margin-right: 4px;
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const ColorSchemes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SchemeButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: ${({ theme, selected }) => selected 
    ? `2px solid ${theme.colors.primary}` 
    : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: 4px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 60px;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ColorPreview = styled.div`
  display: flex;
  width: 100%;
  height: 20px;
  margin-bottom: 4px;
  border-radius: 4px;
  overflow: hidden;
`;

const ColorSwatch = styled.div`
  flex: 1;
  background-color: ${({ color }) => color};
`;

const SchemeLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Word cloud color schemes
export const WORD_CLOUD_COLOR_SCHEMES = {
  default: {
    label: 'Default',
    colors: [
      '#4285F4', '#0F9D58', '#F4B400', '#DB4437', 
      '#3949AB', '#00ACC1', '#00897B', '#43A047',
      '#7CB342', '#C0CA33', '#FFA000', '#F4511E'
    ]
  },
  rainbow: {
    label: 'Rainbow',
    colors: [
      '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
      '#0000FF', '#4B0082', '#9400D3', '#FF1493',
      '#00FFFF', '#1E90FF', '#FF00FF', '#FFD700'
    ]
  },
  pastel: {
    label: 'Pastel',
    colors: [
      '#FFD3E0', '#FFF0D3', '#D3F9D8', '#D3F0FF', 
      '#E1D3FF', '#FFE6CC', '#CCE6FF', '#CCFFCC',
      '#FFCCCC', '#CCF2FF', '#E6CCFF', '#FFF2CC'
    ]
  },
  ocean: {
    label: 'Ocean',
    colors: [
      '#01579B', '#0277BD', '#0288D1', '#039BE5', 
      '#29B6F6', '#4FC3F7', '#26C6DA', '#00ACC1',
      '#00838F', '#00695C', '#004D40', '#006064'
    ]
  },
  forest: {
    label: 'Forest',
    colors: [
      '#1B5E20', '#2E7D32', '#388E3C', '#43A047', 
      '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
      '#304FFE', '#536DFE', '#00BFA5', '#00BCD4'
    ]
  },
  autumn: {
    label: 'Autumn',
    colors: [
      '#BF360C', '#D84315', '#E64A19', '#F4511E', 
      '#FF5722', '#FF7043', '#FF8A65', '#FFAB91',
      '#F57F17', '#F9A825', '#FBC02D', '#FFD54F'
    ]
  },
  monochrome: {
    label: 'Mono',
    colors: [
      '#212121', '#424242', '#616161', '#757575', 
      '#9E9E9E', '#BDBDBD', '#E0E0E0', '#EEEEEE',
      '#2C3E50', '#34495E', '#7F8C8D', '#95A5A6'
    ]
  }
};

/**
 * Word Cloud Color Scheme Selector Component
 * Allows users to select different color schemes for word cloud visualization
 * 
 * @param {Object} props
 * @param {string} props.selectedScheme - Currently selected color scheme key
 * @param {function} props.onChange - Function called when color scheme changes
 */
const WordCloudColorSchemeSelector = ({ selectedScheme = 'default', onChange }) => {
  const handleSelectScheme = (schemeKey) => {
    if (onChange) {
      onChange(schemeKey);
    }
  };
  
  return (
    <SelectorContainer data-testid="word-cloud-color-scheme-selector">
      <SelectorTitle>
        <PaletteIcon /> Color Scheme
      </SelectorTitle>
      <ColorSchemes>
        {Object.entries(WORD_CLOUD_COLOR_SCHEMES).map(([key, scheme]) => (
          <SchemeButton
            key={key}
            selected={selectedScheme === key}
            onClick={() => handleSelectScheme(key)}
            title={scheme.label}
          >
            <ColorPreview>
              {scheme.colors.slice(0, 4).map((color, index) => (
                <ColorSwatch key={index} color={color} />
              ))}
            </ColorPreview>
            <SchemeLabel>{scheme.label}</SchemeLabel>
          </SchemeButton>
        ))}
      </ColorSchemes>
    </SelectorContainer>
  );
};

export default WordCloudColorSchemeSelector;
