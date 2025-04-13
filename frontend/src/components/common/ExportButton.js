import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';
import useClickOutside from '../../hooks/useClickOutside';

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme, $variant }) => 
    $variant === 'primary' ? theme.colors.primary : 
    theme.colors.background.secondary};
  color: ${({ theme, $variant }) => 
    $variant === 'primary' ? 'white' : theme.colors.text.primary};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, $variant }) => 
      $variant === 'primary' ? `${theme.colors.primary}DD` : 
      theme.colors.background.tertiary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  width: 200px;
  z-index: 100;
  overflow: hidden;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * ExportButton component for exporting data in different formats
 * @param {Object} props - Component props
 * @param {string} props.type - Type of activity (poll, quiz, wordcloud, qa)
 * @param {string} props.itemId - ID of the item to export
 * @param {string} props.presentationId - Optional presentation ID for report generation
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.variant - Button variant ('primary' or default)
 */
const ExportButton = ({ 
  type, 
  itemId, 
  presentationId, 
  disabled = false, 
  variant 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError } = useNotification();
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const closeDropdown = useCallback(() => {
    if (isOpen) setIsOpen(false);
  }, [isOpen]);

  // Use the click outside hook
  const dropdownRef = useClickOutside(closeDropdown);

  // Helper function to download a file
  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export as CSV
  const handleCSVExport = async () => {
    setIsLoading(true);
    setIsOpen(false);
    
    try {
      // Call the API endpoint for CSV export
      const response = await axios.get(
        `/api/export/${type}s/${itemId}`, 
        { responseType: 'blob' }
      );
      
      // Create a URL for the file and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const filename = `${type}_${itemId}_export.csv`;
      downloadFile(url, filename);
      
      success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`);
    } catch (err) {
      showError('Failed to export data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate PDF report
  const handlePDFExport = async () => {
    setIsLoading(true);
    setIsOpen(false);
    
    try {
      // Call the API endpoint for PDF report generation
      const response = await axios.get(
        `/api/export/reports/${presentationId || itemId}`, 
        { responseType: 'blob' }
      );
      
      // Create a URL for the file and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const filename = `presentation_${presentationId || itemId}_report.pdf`;
      downloadFile(url, filename);
      
      success('PDF report generated successfully!');
    } catch (err) {
      showError('Failed to generate PDF report');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <Button 
        onClick={toggleDropdown} 
        disabled={disabled || isLoading} 
        $variant={variant}
      >
        {isLoading ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </>
        )}
      </Button>
      
      <DropdownMenu $isOpen={isOpen}>
        <DropdownItem onClick={handleCSVExport}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 3V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H14L19 8V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 17H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export as CSV
        </DropdownItem>
        
        {presentationId && (
          <DropdownItem onClick={handlePDFExport}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Generate PDF Report
          </DropdownItem>
        )}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default ExportButton;
