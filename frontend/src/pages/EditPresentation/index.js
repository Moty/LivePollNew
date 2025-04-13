import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import ActivityEditModal from './ActivityEditModal';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Form = styled.form`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.body};
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.body};
  min-height: 120px;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-weight: 500;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  background-color: ${({ theme, primary, danger }) => 
    primary ? theme.colors.primary :
    danger ? theme.colors.error :
    theme.colors.background.secondary};
  color: ${({ theme, primary, danger }) => 
    (primary || danger) ? 'white' : theme.colors.text.primary};
  
  &:hover {
    background-color: ${({ theme, primary, danger }) => 
      primary ? `${theme.colors.primary}DD` : 
      danger ? `${theme.colors.error}DD` : 
      theme.colors.background.tertiary};
  }
`;

const ActivitiesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActivityItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const ActivityContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ActivityIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const ActivityTitle = styled.div`
  font-weight: 500;
`;

const ActivityActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme, danger }) => danger ? theme.colors.error : theme.colors.primary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.primary};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
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

const ActivityTypeSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActivityTypeButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme, selected }) => 
    selected ? `${theme.colors.primary}20` : theme.colors.background.primary};
  color: ${({ theme, selected }) => 
    selected ? theme.colors.primary : theme.colors.text.primary};
  font-weight: ${({ selected }) => selected ? '600' : '400'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const EditPresentation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { success, error: showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    title: '',
    description: ''
  });
  const [activities, setActivities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  
  // Fetch presentation data
  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        setLoading(true);
        console.log(`Fetching presentation with ID: ${id}`);
        const response = await apiService.getPresentation(id);
        
        if (!response.data) {
          throw new Error('No data returned from API');
        }
        
        const data = response.data;
        console.log('Fetched presentation data:', data);
        
        setFormValues({
          title: data.title || '',
          description: data.description || ''
        });
        
        setActivities(data.activities || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch presentation:', err);
        showError('Failed to fetch presentation: ' + (err.message || 'Unknown error'));
        navigate('/dashboard');
      }
    };
    
    if (id) {
      fetchPresentation();
    }
  }, [id, navigate, showError]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValues.title.trim()) {
      showError('Please enter a presentation title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const presentationData = {
        ...formValues,
        activities
      };
      
      console.log('Updating presentation with data:', presentationData);
      await apiService.updatePresentation(id, presentationData);
      
      success('Presentation updated successfully');
      navigate('/dashboard', { state: { refresh: true } });
    } catch (err) {
      console.error('Failed to update presentation:', err);
      showError('Failed to update presentation: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddActivity = () => {
    if (!selectedActivityType) return;
    
    const newActivity = {
      id: `temp_${Date.now()}`,
      type: selectedActivityType,
      title: `New ${selectedActivityType.charAt(0).toUpperCase() + selectedActivityType.slice(1)}`,
      config: {}
    };
    
    setActivities(prev => [...prev, newActivity]);
    setSelectedActivityType(null);
  };
  
  const handleRemoveActivity = (activityId) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  };
  
  const handleEditActivity = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setCurrentActivity(activity);
      setModalOpen(true);
    }
  };
  
  const handleSaveActivity = (updatedActivity) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    );
    setCurrentActivity(null);
    setModalOpen(false);
  };
  
  const handleCloseModal = () => {
    setCurrentActivity(null);
    setModalOpen(false);
  };
  
  const activityTypes = [
    { 
      id: 'poll', 
      name: 'Poll', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      id: 'quiz', 
      name: 'Quiz', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      id: 'wordcloud', 
      name: 'Word Cloud', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 14.8995C2.75 13.7319 2 12.0972 2 10.2726C2 6.73423 5 3.86592 9 4.19765C11 1.32935 16 1.32935 18 4.19765C22 3.86592 25 6.73423 25 10.2726C25 12.0972 23.25 13.7319 22 14.8995" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12C11.3333 12.6667 10 14.5 10 16C10 17.5 11 19 13 19C15 19 16 17.5 16 16C16 14.5 14.6667 12.6667 14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      id: 'qa', 
      name: 'Q&A', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'survey', 
      name: 'Survey', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];
  
  const getActivityIcon = (type) => {
    const activity = activityTypes.find(t => t.id === type);
    return activity ? activity.icon : null;
  };
  
  if (loading) {
    return (
      <Container>
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
      </Container>
    );
  }
  
  return (
    <Container>
      <Title>Edit Presentation</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="title">Presentation Title</Label>
          <Input
            type="text"
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleInputChange}
            placeholder="Enter a title for your presentation"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            placeholder="Enter a description for your presentation"
          />
        </FormGroup>
        
        <ActivitiesSection>
          <SectionTitle>Activities</SectionTitle>
          
          <ActivityList>
            {activities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityContent>
                  <ActivityIcon>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityTitle>
                    {activity.title || `Untitled ${activity.type}`}
                  </ActivityTitle>
                </ActivityContent>
                <ActivityActions>
                  <ActionButton onClick={() => handleEditActivity(activity.id)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </ActionButton>
                  <ActionButton danger onClick={() => handleRemoveActivity(activity.id)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </ActionButton>
                </ActivityActions>
              </ActivityItem>
            ))}
          </ActivityList>
          
          <SectionTitle>Add New Activity</SectionTitle>
          <ActivityTypeSelector>
            {activityTypes.map(type => (
              <ActivityTypeButton
                key={type.id}
                selected={selectedActivityType === type.id}
                onClick={() => setSelectedActivityType(type.id)}
                type="button"
              >
                {type.icon}
                {type.name}
              </ActivityTypeButton>
            ))}
          </ActivityTypeSelector>
          
          {selectedActivityType && (
            <Button type="button" onClick={handleAddActivity}>
              Add {activityTypes.find(t => t.id === selectedActivityType)?.name}
            </Button>
          )}
        </ActivitiesSection>
        
        <ButtonGroup>
          <Button type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" primary disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </ButtonGroup>
      </Form>
      
      {modalOpen && currentActivity && (
        <ActivityEditModal
          activity={currentActivity}
          onSave={handleSaveActivity}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
};

export default EditPresentation;