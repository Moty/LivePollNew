import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  height: calc(100vh - 64px);
  overflow-y: auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const Title = styled.h1`
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + 'DD'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SearchBarWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  padding-left: calc(${({ theme }) => theme.spacing.md} * 3);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.body};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button`
  background: none;
  border: none;
  border-bottom: 3px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : 'transparent'};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  color: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.text.primary};
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PresentationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const PresentationCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transitions.default}, box-shadow ${({ theme }) => theme.transitions.default};
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const PresentationImage = styled.div`
  height: 160px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  background-image: ${({ backgroundImage }) => backgroundImage ? `url(${backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ theme }) => `linear-gradient(45deg, ${theme.colors.primary}22, ${theme.colors.primary}11)`};
  }
  
  svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
    z-index: 1;
  }
`;

const PresentationContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PresentationTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const PresentationMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const PresentationActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: auto;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme, $variant }) => 
    $variant === 'primary' 
      ? theme.colors.primary 
      : $variant === 'danger'
        ? theme.colors.error
        : $variant === 'secondary'
          ? theme.colors.background.secondary
          : 'transparent'
  };
  color: ${({ theme, $variant }) => 
    $variant === 'primary' || $variant === 'danger'
      ? theme.colors.text.light
      : theme.colors.text.primary
  };
  border: ${({ theme, $variant }) => 
    $variant === 'primary' || $variant === 'danger'
      ? 'none'
      : $variant === 'secondary'
        ? `1px solid ${theme.colors.primary}33`
        : `1px solid ${theme.colors.border.light}`
  };
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme, $variant }) => 
      $variant === 'primary' 
        ? theme.colors.primary + 'DD' 
        : $variant === 'danger'
          ? theme.colors.error + 'DD'
          : $variant === 'secondary'
            ? theme.colors.primary + '15'
            : theme.colors.background.secondary
    };
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.5;
  }
`;

const EmptyTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  
  svg {
    animation: spin 1s linear infinite;
    color: ${({ theme }) => theme.colors.primary};
    width: 48px;
    height: 48px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => `${theme.colors.error}15`};
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const RetryButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  cursor: pointer;
  margin-left: auto;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.error}15`};
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [presentations, setPresentations] = useState([]);
  const [presentationSessions, setPresentationSessions] = useState({}); // Store sessions per presentation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const fetchPresentations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching presentations');
      const response = await apiService.getPresentations();
      console.log('Received response:', response);
      
      if (response && response.data) {
        const presentationsArray = Array.isArray(response.data) 
          ? response.data 
          : [];
        
        const validPresentations = presentationsArray.map(presentation => ({
          ...presentation,
          id: presentation.id || presentation._id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          activities: Array.isArray(presentation.activities) ? presentation.activities : []
        }));
        
        console.log('Processed presentations:', validPresentations);
        setPresentations(validPresentations);
        
        // Fetch sessions for each presentation
        await fetchPresentationSessions(validPresentations);
      } else {
        console.warn('Invalid or empty response format:', response);
        setPresentations([]);
      }
    } catch (err) {
      console.error('Error fetching presentations:', err);
      setError(err.response?.data?.error || 'Failed to load presentations');
      setPresentations([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch sessions for each presentation
  const fetchPresentationSessions = useCallback(async (presentationsArray) => {
    try {
      const sessionsMap = {};
      
      // Fetch sessions for each presentation
      await Promise.allSettled(
        presentationsArray.map(async (presentation) => {
          try {
            console.log(`Fetching sessions for presentation ${presentation.id}`);
            const response = await apiService.listSessions(presentation.id);
            
            if (response && response.data) {
              const sessions = Array.isArray(response.data) ? response.data : [];
              console.log(`Found ${sessions.length} sessions for presentation ${presentation.id}`);
              
              // Calculate summary stats for each session
              const sessionsWithStats = await Promise.allSettled(
                sessions.map(async (session) => {
                  try {
                    // For now, we'll just store session info
                    // Later we can fetch detailed results if needed
                    return {
                      ...session,
                      totalResponses: session.totalResponses || 0,
                      lastActive: session.lastActive || session.createdAt
                    };
                  } catch (err) {
                    console.warn(`Error fetching stats for session ${session.id}:`, err);
                    return session;
                  }
                })
              );
              
              sessionsMap[presentation.id] = sessionsWithStats
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            } else {
              sessionsMap[presentation.id] = [];
            }
          } catch (err) {
            console.warn(`Error fetching sessions for presentation ${presentation.id}:`, err);
            sessionsMap[presentation.id] = [];
          }
        })
      );
      
      console.log('Fetched sessions map:', sessionsMap);
      setPresentationSessions(sessionsMap);
    } catch (err) {
      console.error('Error fetching presentation sessions:', err);
    }
  }, []);
  
  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);
  
  useEffect(() => {
    if (location.state?.refresh) {
      fetchPresentations();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, fetchPresentations, navigate]);
  
  const handleCreatePresentation = () => {
    navigate('/create');
  };
  
  const handleEditPresentation = (id) => {
    navigate(`/edit/${id}`);
  };
  
  const handlePresentPresentation = (id) => {
    navigate(`/present/${id}`);
  };
  
  const handleViewResults = (presentationId) => {
    // For now, we'll navigate to a simple results view
    // Later this can be enhanced with a dedicated results page
    const sessions = presentationSessions[presentationId] || [];
    if (sessions.length === 0) {
      showNotification('No session results found for this presentation.', 'info');
      return;
    }
    
    // For demo purposes, show session info in alert
    // In production, this would navigate to a results page
    const sessionSummary = sessions.map(session => 
      `Session ${session.code || session.id}: ${session.totalResponses || 0} responses`
    ).join('\n');
    
    alert(`Results for Presentation:\n${sessionSummary}\n\nResults viewing page coming soon!`);
  };
  
  const handleDeletePresentation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this presentation?')) {
      return;
    }
    
    try {
      await apiService.deletePresentation(id);
      success('Presentation deleted successfully');
      fetchPresentations();
    } catch (err) {
      console.error('Error deleting presentation:', err);
      showError(err.response?.data?.error || 'Failed to delete presentation');
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Recently created';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Recently created';
      }
      
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return 'Today';
      } else if (diffInHours < 48) {
        return 'Yesterday';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Recently created';
    }
  };
  
  const isRecent = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      // Check if date is within the last 7 days
      return !isNaN(date.getTime()) && 
        (now - date) <= 7 * 24 * 60 * 60 * 1000;
    } catch (err) {
      console.warn('Error checking if date is recent:', err);
      return false;
    }
  };
  
  const filteredPresentations = useMemo(() => {
    const presentationsArray = Array.isArray(presentations) ? presentations : [];
    
    if (!searchQuery.trim() && activeTab === 'all') {
      return presentationsArray;
    }
    
    return presentationsArray.filter(presentation => {
      const matchesSearch = searchQuery.trim() === '' || 
        presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (presentation.description && presentation.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'recent' && isRecent(presentation.createdAt));
      
      return matchesSearch && matchesTab;
    });
  }, [presentations, searchQuery, activeTab]);
  
  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>My Presentations</Title>
        <CreateButton onClick={handleCreatePresentation}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create New
        </CreateButton>
      </DashboardHeader>
      
      {error && (
        <ErrorMessage>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
          <RetryButton onClick={fetchPresentations}>
            Retry
          </RetryButton>
        </ErrorMessage>
      )}
      
      <SearchBarWrapper>
        <SearchIcon>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </SearchIcon>
        <SearchBar
          type="text"
          placeholder="Search presentations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchBarWrapper>
      
      <TabsContainer>
        <Tab
          $active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        >
          All
        </Tab>
        <Tab
          $active={activeTab === 'recent'}
          onClick={() => setActiveTab('recent')}
        >
          Recent
        </Tab>
        <Tab
          $active={activeTab === 'favorites'}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </Tab>
      </TabsContainer>
      
      {loading ? (
        <LoadingSpinner>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </LoadingSpinner>
      ) : filteredPresentations.length > 0 ? (
        <PresentationsGrid>
          {filteredPresentations.map(presentation => (
            <PresentationCard key={presentation.id}>
              <PresentationImage>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </PresentationImage>
              
              <PresentationContent>
                <PresentationTitle>{presentation.title}</PresentationTitle>
                <PresentationMeta>
                  <span>
                    {presentation.createdAt 
                      ? `Created ${formatDate(presentation.createdAt)}`
                      : 'Recently created'}
                  </span>
                  <span>{presentation.activities?.length || 0} activities</span>
                  {(() => {
                    const sessions = presentationSessions[presentation.id] || [];
                    const totalSessions = sessions.length;
                    const totalResponses = sessions.reduce((sum, session) => sum + (session.totalResponses || 0), 0);
                    
                    if (totalSessions > 0) {
                      return (
                        <span style={{ color: '#22c55e', fontWeight: '600' }}>
                          📊 {totalSessions} session{totalSessions > 1 ? 's' : ''} • {totalResponses} response{totalResponses !== 1 ? 's' : ''}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </PresentationMeta>
                <PresentationActions>
                  <ActionButton $variant="primary" onClick={() => handlePresentPresentation(presentation.id)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Present
                  </ActionButton>
                  {(() => {
                    const sessions = presentationSessions[presentation.id] || [];
                    if (sessions.length > 0) {
                      return (
                        <ActionButton $variant="secondary" onClick={() => handleViewResults(presentation.id)}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 9L12 6L16 10L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Results
                        </ActionButton>
                      );
                    }
                    return null;
                  })()}
                  <ActionButton onClick={() => handleEditPresentation(presentation.id)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </ActionButton>
                  <ActionButton $variant="danger" onClick={() => handleDeletePresentation(presentation.id)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </ActionButton>
                </PresentationActions>
              </PresentationContent>
            </PresentationCard>
          ))}
        </PresentationsGrid>
      ) : (
        <EmptyState>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <EmptyTitle>No presentations found</EmptyTitle>
          <p>
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first presentation to get started'}
          </p>
          {!searchQuery && (
            <CreateButton onClick={handleCreatePresentation}>
              Create New Presentation
            </CreateButton>
          )}
        </EmptyState>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
