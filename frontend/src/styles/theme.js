// Theme for styled-components
const theme = {
  colors: {
    primary: '#2F80ED',     // Blue - main brand color
    primaryDark: '#1366D6', // Darker blue for hover states
    secondary: '#56CCF2',   // Light blue - secondary brand color
    accent: '#6FCF97',      // Green - for success/confirmation
    warning: '#F2C94C',     // Yellow - for warnings
    error: '#EB5757',       // Red - for errors
    disabled: '#BDBDBD',    // Gray for disabled elements
    
    text: {
      primary: '#333333',   // Dark gray for primary text
      secondary: '#828282', // Medium gray for secondary text
      light: '#F2F2F2',     // Light gray/white for dark backgrounds
    },
    
    background: {
      primary: '#FFFFFF',   // White for main background
      secondary: '#F8F8F8', // Light gray for secondary background
      tertiary: '#F0F0F0',  // Slightly darker gray for hover states
      dark: '#333333',      // Dark for contrast sections
    },
    
    border: '#E0E0E0',      // Light gray for borders
  },
  
  fonts: {
    primary: "'Roboto', 'Segoe UI', 'Helvetica', 'Arial', sans-serif",
    heading: "'Poppins', 'Roboto', 'Segoe UI', sans-serif",
    monospace: "'Roboto Mono', monospace",
  },
  
  fontSizes: {
    small: '0.8rem',
    body: '1rem',
    h1: '2.5rem',
    h2: '2rem',
    h3: '1.75rem',
    h4: '1.5rem',
    h5: '1.25rem',
    h6: '1rem',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  borderRadius: {
    small: '4px',
    default: '8px',
    large: '16px',
    round: '50%',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    default: '0 4px 6px rgba(0, 0, 0, 0.1)',
    medium: '0 6px 10px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    laptop: '992px',
    desktop: '1200px',
  },
  
  transitions: {
    default: '0.3s ease',
    fast: '0.15s ease',
    slow: '0.5s ease',
  },
};

export default theme;
