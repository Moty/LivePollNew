import React from 'react';
import styled from 'styled-components';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  DonutLarge as DonutIcon,
  BarChart as HorizontalBarIcon  // Using same icon but will rotate it
} from '@material-ui/icons';

const SelectorContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ChartTypeButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.background.secondary};
  color: ${({ theme, selected }) => 
    selected ? theme.colors.text.light : theme.colors.text.primary};
  border: ${({ theme, selected }) => 
    selected ? 'none' : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.sm};
  min-width: 80px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, selected }) => 
      selected ? theme.colors.primary : theme.colors.background.secondary + 'DD'};
    transform: translateY(-2px);
  }
  
  .icon {
    margin-bottom: 4px;
  }
  
  .horizontal {
    transform: rotate(90deg);
  }
`;

const ChartTypeLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-top: 4px;
`;

const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: BarChartIcon },
  { id: 'pie', label: 'Pie', icon: PieChartIcon },
  { id: 'doughnut', label: 'Doughnut', icon: DonutIcon },
  { id: 'horizontalBar', label: 'Horizontal Bar', icon: HorizontalBarIcon, className: 'horizontal' }
];

/**
 * Chart Type Selector Component
 * Allows users to select different chart types for data visualization
 * 
 * @param {Object} props
 * @param {string} props.selectedType - Currently selected chart type
 * @param {function} props.onChange - Function called when chart type changes
 */
const ChartTypeSelector = ({ selectedType = 'bar', onChange }) => {
  const handleSelectType = (type) => {
    if (onChange) {
      onChange(type);
    }
  };
  
  return (
    <SelectorContainer data-testid="chart-type-selector">
      {CHART_TYPES.map(({ id, label, icon: Icon, className }) => (
        <ChartTypeButton
          key={id}
          selected={selectedType === id}
          onClick={() => handleSelectType(id)}
        >
          <Icon className={`icon ${className || ''}`} />
          <ChartTypeLabel>{label}</ChartTypeLabel>
        </ChartTypeButton>
      ))}
    </SelectorContainer>
  );
};

export default ChartTypeSelector; 