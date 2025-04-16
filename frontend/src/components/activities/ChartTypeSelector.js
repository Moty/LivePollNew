import React from 'react';
import styled from 'styled-components';

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
    fill: ${({ theme, selected }) => 
      selected ? theme.colors.text.light : theme.colors.text.primary};
    width: 24px;
    height: 24px;
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
  { 
    id: 'bar', 
    label: 'Bar', 
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
      </svg>
    )
  },
  { 
    id: 'pie', 
    label: 'Pie', 
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
      </svg>
    )
  },
  { 
    id: 'doughnut', 
    label: 'Doughnut', 
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M11 5.08V2c-5 .5-9 4.81-9 10s4 9.5 9 10v-3.08c-3-.48-6-3.4-6-6.92s3-6.44 6-6.92zM18.97 11H22c-.47-5-4-9-9-9.5v3.08C16 5.05 18.5 7.8 18.97 11zM13 18.92V22c5-.5 8.5-4 9-9h-3.03c-.47 3.2-3 5.75-5.97 5.92z"/>
      </svg>
    )
  },
  { 
    id: 'horizontalBar', 
    label: 'Horizontal Bar', 
    icon: (
      <svg className="icon horizontal" viewBox="0 0 24 24">
        <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
      </svg>
    ),
    className: 'horizontal'
  }
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
      {CHART_TYPES.map(({ id, label, icon, className }) => (
        <ChartTypeButton
          key={id}
          selected={selectedType === id}
          onClick={() => handleSelectType(id)}
        >
          {icon}
          <ChartTypeLabel>{label}</ChartTypeLabel>
        </ChartTypeButton>
      ))}
    </SelectorContainer>
  );
};

export default ChartTypeSelector; 