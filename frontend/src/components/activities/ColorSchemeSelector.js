import React from 'react';
import styled from 'styled-components';

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
    font-size: 16px;
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

// Predefined color schemes
export const COLOR_SCHEMES = {
  default: {
    label: 'Default',
    backgroundColor: [
      'rgba(47, 128, 237, 0.8)',
      'rgba(86, 204, 242, 0.8)',
      'rgba(111, 207, 151, 0.8)',
      'rgba(242, 201, 76, 0.8)',
      'rgba(235, 87, 87, 0.8)',
      'rgba(155, 81, 224, 0.8)',
    ],
    borderColor: [
      'rgba(47, 128, 237, 1)',
      'rgba(86, 204, 242, 1)',
      'rgba(111, 207, 151, 1)',
      'rgba(242, 201, 76, 1)',
      'rgba(235, 87, 87, 1)',
      'rgba(155, 81, 224, 1)',
    ]
  },
  vibrant: {
    label: 'Vibrant',
    backgroundColor: [
      'rgba(255, 63, 63, 0.8)',
      'rgba(255, 175, 63, 0.8)',
      'rgba(255, 253, 84, 0.8)',
      'rgba(120, 220, 82, 0.8)',
      'rgba(86, 180, 255, 0.8)',
      'rgba(200, 83, 255, 0.8)',
    ],
    borderColor: [
      'rgba(255, 63, 63, 1)',
      'rgba(255, 175, 63, 1)',
      'rgba(255, 253, 84, 1)',
      'rgba(120, 220, 82, 1)',
      'rgba(86, 180, 255, 1)',
      'rgba(200, 83, 255, 1)',
    ]
  },
  pastel: {
    label: 'Pastel',
    backgroundColor: [
      'rgba(204, 224, 255, 0.8)',
      'rgba(204, 255, 218, 0.8)',
      'rgba(255, 235, 204, 0.8)',
      'rgba(255, 204, 204, 0.8)',
      'rgba(235, 204, 255, 0.8)',
      'rgba(204, 255, 255, 0.8)',
    ],
    borderColor: [
      'rgba(153, 194, 255, 1)',
      'rgba(153, 245, 179, 1)',
      'rgba(245, 215, 153, 1)',
      'rgba(245, 153, 153, 1)',
      'rgba(214, 153, 245, 1)',
      'rgba(153, 245, 245, 1)',
    ]
  },
  monochrome: {
    label: 'Mono',
    backgroundColor: [
      'rgba(52, 73, 94, 0.9)',
      'rgba(52, 73, 94, 0.75)',
      'rgba(52, 73, 94, 0.6)',
      'rgba(52, 73, 94, 0.45)',
      'rgba(52, 73, 94, 0.3)',
      'rgba(52, 73, 94, 0.15)',
    ],
    borderColor: [
      'rgba(52, 73, 94, 1)',
      'rgba(52, 73, 94, 1)',
      'rgba(52, 73, 94, 1)',
      'rgba(52, 73, 94, 1)',
      'rgba(52, 73, 94, 1)',
      'rgba(52, 73, 94, 1)',
    ]
  },
  material: {
    label: 'Material',
    backgroundColor: [
      'rgba(96, 125, 139, 0.8)',
      'rgba(233, 30, 99, 0.8)',
      'rgba(156, 39, 176, 0.8)',
      'rgba(3, 169, 244, 0.8)',
      'rgba(0, 150, 136, 0.8)',
      'rgba(255, 152, 0, 0.8)',
    ],
    borderColor: [
      'rgba(96, 125, 139, 1)',
      'rgba(233, 30, 99, 1)',
      'rgba(156, 39, 176, 1)',
      'rgba(3, 169, 244, 1)',
      'rgba(0, 150, 136, 1)',
      'rgba(255, 152, 0, 1)',
    ]
  }
};

/**
 * Color Scheme Selector Component
 * Allows users to select different color schemes for chart visualization
 * 
 * @param {Object} props
 * @param {string} props.selectedScheme - Currently selected color scheme key
 * @param {function} props.onChange - Function called when color scheme changes
 */
const ColorSchemeSelector = ({ selectedScheme = 'default', onChange }) => {
  const handleSelectScheme = (schemeKey) => {
    if (onChange) {
      onChange(schemeKey);
    }
  };
  
  return (
    <SelectorContainer data-testid="color-scheme-selector">
      <SelectorTitle>
        <svg viewBox="0 0 24 24">
          <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
          <circle cx="6.5" cy="11.5" r="1.5"/>
          <circle cx="9.5" cy="7.5" r="1.5"/>
          <circle cx="14.5" cy="7.5" r="1.5"/>
          <circle cx="17.5" cy="11.5" r="1.5"/>
        </svg>
        Color Scheme
      </SelectorTitle>
      <ColorSchemes>
        {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
          <SchemeButton
            key={key}
            selected={selectedScheme === key}
            onClick={() => handleSelectScheme(key)}
            title={scheme.label}
          >
            <ColorPreview>
              {scheme.backgroundColor.slice(0, 4).map((color, index) => (
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

export default ColorSchemeSelector; 