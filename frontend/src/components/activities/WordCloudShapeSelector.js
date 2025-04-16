import React from 'react';
import styled from 'styled-components';
import ShapeIcon from '../icons/ShapeIcon';
import CircleIcon from '../icons/CircleIcon';
import SquareIcon from '../icons/SquareIcon';
import StarIcon from '../icons/StarIcon';
import HeartIcon from '../icons/HeartIcon';
import GlobeIcon from '../icons/GlobeIcon';

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

const ShapesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ShapeButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: ${({ theme, selected }) => selected 
    ? `2px solid ${theme.colors.primary}` 
    : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: 8px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 60px;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  svg {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    fill: ${({ theme, selected }) => 
      selected ? theme.colors.primary : theme.colors.text.primary};
  }
`;

const ShapeLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Available word cloud shapes
export const WORD_CLOUD_SHAPES = {
  rectangle: {
    label: 'Rectangle',
    icon: SquareIcon,
    // Rectangle has no specific mask, it's the default layout
    mask: null
  },
  circle: {
    label: 'Circle',
    icon: CircleIcon,
    getPolygon: (size) => {
      const points = [];
      const radius = size / 2;
      const center = size / 2;
      const numPoints = 64; // Higher for smoother circle
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push([x, y]);
      }
      
      return points;
    }
  },
  star: {
    label: 'Star',
    icon: StarIcon,
    getPolygon: (size) => {
      const points = [];
      const outerRadius = size / 2;
      const innerRadius = outerRadius * 0.4;
      const center = size / 2;
      const numPoints = 5;
      
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i / (numPoints * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = center + radius * Math.sin(angle);
        const y = center + radius * Math.cos(angle);
        points.push([x, y]);
      }
      
      return points;
    }
  },
  heart: {
    label: 'Heart',
    icon: HeartIcon,
    getPolygon: (size) => {
      // Heart shape approximation using points
      const points = [];
      const numPoints = 30;
      const center = size / 2;
      const scale = size / 24;
      
      // Heart shape parametric equation
      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        points.push([center + x * scale, center - y * scale]);
      }
      
      return points;
    }
  },
  globe: {
    label: 'Globe',
    icon: GlobeIcon,
    getPolygon: (size) => {
      // Simplified globe/map shape
      const points = [];
      const center = size / 2;
      const radius = size / 2.2;
      const numPoints = 64;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle) * 0.8; // Slightly flattened circle
        points.push([x, y]);
      }
      
      return points;
    }
  }
};

/**
 * Word Cloud Shape Selector Component
 * Allows users to select different shape constraints for word cloud layout
 * 
 * @param {Object} props
 * @param {string} props.selectedShape - Currently selected shape key
 * @param {function} props.onChange - Function called when shape changes
 */
const WordCloudShapeSelector = ({ selectedShape = 'rectangle', onChange }) => {
  const handleSelectShape = (shapeKey) => {
    if (onChange) {
      onChange(shapeKey);
    }
  };
  
  return (
    <SelectorContainer data-testid="word-cloud-shape-selector">
      <SelectorTitle>
        <ShapeIcon /> Cloud Shape
      </SelectorTitle>
      <ShapesContainer>
        {Object.entries(WORD_CLOUD_SHAPES).map(([key, shape]) => {
          const ShapeIconComponent = shape.icon;
          return (
            <ShapeButton
              key={key}
              selected={selectedShape === key}
              onClick={() => handleSelectShape(key)}
              title={shape.label}
            >
              <ShapeIconComponent />
              <ShapeLabel>{shape.label}</ShapeLabel>
            </ShapeButton>
          );
        })}
      </ShapesContainer>
    </SelectorContainer>
  );
};

export default WordCloudShapeSelector;
