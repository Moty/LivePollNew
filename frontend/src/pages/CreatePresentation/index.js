import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

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
  
  background-color: ${({ theme, primary }) => 
    primary ? theme.colors.primary : theme.colors.background.secondary};
  color: ${({ theme, primary }) => 
    primary ? 'white' : theme.colors.text.primary};
  
  &:hover {
    background-color: ${({ theme, primary }) => 
      primary ? `${theme.colors.primary}DD` : theme.colors.background.tertiary};
  }
`;

const ActivitiesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const ActivityTypeSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActivityTypeButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ theme, selected }) =>
    selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme, selected }) =>
    selected ? `${theme.colors.primary}20` : theme.colors.background.primary};
  color: ${({ theme, selected }) =>
    selected ? theme.colors.primary : theme.colors.text.primary};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 100px;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 28px;
    height: 28px;
  }

  span {
    font-size: 0.875rem;
  }
`;

// New components for displaying added activities
const ActivityCounter = styled.span`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const ActivitiesList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const ActivityInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ActivityName = styled.span`
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.error}15`};
  }
`;

const EmptyActivities = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const ActivityForm = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const ActivityFormTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const OptionInput = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AddOptionButton = styled.button`
  background: none;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  cursor: pointer;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: block;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
`;

const CreatePresentation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { success, error: showError } = useNotification();
  
  const [formValues, setFormValues] = useState({
    title: '',
    description: ''
  });
  
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentActivity, setCurrentActivity] = useState(null);
  
  const validateActivity = (activity) => {
    const errors = {};
    
    if (!activity.title?.trim()) {
      errors.title = 'Activity title is required';
    }
    
    if (activity.type === 'poll') {
      if (!activity.config?.options?.length) {
        errors.options = 'At least one option is required';
      } else if (activity.config.options.some(opt => !opt.trim())) {
        errors.options = 'All options must have content';
      }
    }
    
    if (activity.type === 'quiz') {
      if (!activity.config?.questions?.length) {
        errors.questions = 'At least one question is required';
      } else {
        const questionErrors = activity.config.questions.some(question => {
          if (!question.text?.trim()) {
            return true;
          }
          if (!question.options?.length) {
            return true;
          }
          if (question.options.some(opt => !opt.trim())) {
            return true;
          }
          if (question.correctIndex === null) {
            return true;
          }
          return false;
        });
        
        if (questionErrors) {
          errors.questions = 'All questions must have text, at least one option, and a correct answer selected';
        }
      }
    }
    
    return errors;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleActivityInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentActivity(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleAddOption = () => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        options: [...(prev.config.options || []), '']
      }
    }));
  };
  
  const handleOptionChange = (index, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        options: prev.config.options.map((opt, i) => i === index ? value : opt)
      }
    }));
  };
  
  const handleRemoveOption = (index) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        options: prev.config.options.filter((_, i) => i !== index)
      }
    }));
  };
  
  // Directly open activity form when clicking type button
  const handleSelectActivityType = (typeId) => {
    if (currentActivity !== null) return; // Don't allow if already editing

    const newActivity = {
      id: `temp_${Date.now()}`,
      type: typeId,
      title: '',
      config: {
        options: typeId === 'poll' ? ['', ''] : undefined, // Start with 2 empty options
        questions: typeId === 'quiz' ? [{
          text: '',
          options: ['', '', '', ''], // Start with 4 empty options
          correctIndex: null
        }] : undefined,
        maxSubmissions: typeId === 'wordcloud' ? 3 : undefined,
        isModerated: typeId === 'qa' ? true : undefined
      }
    };

    setSelectedActivityType(typeId);
    setCurrentActivity(newActivity);
  };
  
  const handleSaveActivity = () => {
    if (!currentActivity) return;
    
    const activityErrors = validateActivity(currentActivity);
    if (Object.keys(activityErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...activityErrors }));
      return;
    }
    
    setActivities(prev => [...prev, currentActivity]);
    setCurrentActivity(null);
    setSelectedActivityType(null);
    success(`${getActivityTypeName(currentActivity.type)} added to presentation!`);
  };

  const handleRemoveActivity = (activityIndex) => {
    setActivities(prev => prev.filter((_, index) => index !== activityIndex));
    success('Activity removed from presentation');
  };
  
  const handleCancel = () => {
    if (activities.length > 0) {
      if (!window.confirm('Are you sure you want to cancel? All your changes will be lost.')) {
        return;
      }
    }
    navigate('/dashboard');
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formValues.title?.trim()) {
      newErrors.title = 'Presentation title is required';
    }
    
    if (activities.length === 0) {
      newErrors.activities = 'At least one activity is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format activities for submission
      const formattedActivities = activities.map(({ id, ...activity }) => {
        const formatted = {
          ...activity,
          config: { ...activity.config }
        };
        
        // Format poll options
        if (activity.type === 'poll') {
          formatted.config = {
            question: activity.title,
            options: activity.config.options
          };
        }
        
        // Format quiz questions
        if (activity.type === 'quiz') {
          formatted.config = {
            questions: activity.config.questions.map(q => ({
              text: q.text,
              options: q.options,
              correctIndex: q.correctIndex
            }))
          };
        }
        
        // Format wordcloud config
        if (activity.type === 'wordcloud') {
          formatted.config = {
            description: activity.title,
            maxSubmissions: activity.config.maxSubmissions
          };
        }
        
        // Format Q&A config
        if (activity.type === 'qa') {
          formatted.config = {
            description: activity.title,
            isModerated: activity.config.isModerated
          };
        }
        
        return formatted;
      });
      
      const response = await apiService.createPresentation({
        ...formValues,
        activities: formattedActivities
      });

      success('Presentation created successfully!');
      navigate('/dashboard', { state: { refresh: true } }); // Signal dashboard to refresh
    } catch (err) {
      console.error('Error creating presentation:', err);
      showError(err.response?.data?.error || 'Failed to create presentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityTypeName = (typeId) => {
    const activityType = activityTypes.find(type => type.id === typeId);
    return activityType ? activityType.name : 'Unknown Activity';
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
          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    },
    { 
      id: 'qa', 
      name: 'Q&A', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) 
    }
  ];
  
  const handleQuestionChange = (questionIndex, field, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) => 
          i === questionIndex ? { ...q, [field]: value } : q
        )
      }
    }));
  };

  const handleQuizOptionChange = (questionIndex, optionIndex, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) => 
          i === questionIndex ? {
            ...q,
            options: q.options.map((opt, j) => j === optionIndex ? value : opt)
          } : q
        )
      }
    }));
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) => 
          i === questionIndex ? { ...q, correctIndex: optionIndex } : q
        )
      }
    }));
  };

  const handleAddQuizOption = (questionIndex) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) => 
          i === questionIndex ? {
            ...q,
            options: [...q.options, '']
          } : q
        )
      }
    }));
  };

  const handleRemoveQuizOption = (questionIndex, optionIndex) => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: prev.config.questions.map((q, i) => 
          i === questionIndex ? {
            ...q,
            options: q.options.filter((_, j) => j !== optionIndex),
            correctIndex: q.correctIndex === optionIndex ? null :
              q.correctIndex > optionIndex ? q.correctIndex - 1 : q.correctIndex
          } : q
        )
      }
    }));
  };

  const handleAddQuestion = () => {
    setCurrentActivity(prev => ({
      ...prev,
      config: {
        ...prev.config,
        questions: [
          ...prev.config.questions,
          {
            text: '',
            options: [],
            correctIndex: null
          }
        ]
      }
    }));
  };

  return (
    <Container>
      <Title>Create New Presentation</Title>
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
          {errors.title && <ErrorText>{errors.title}</ErrorText>}
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
          <SectionTitle>
            Add Activities
            {activities.length > 0 && <ActivityCounter>{activities.length}</ActivityCounter>}
          </SectionTitle>
          <p>Select an activity type to add to your presentation</p>
          
          {errors.activities && <ErrorText>{errors.activities}</ErrorText>}
          
          <ActivityTypeSelector>
            {activityTypes.map(type => (
              <ActivityTypeButton
                key={type.id}
                selected={selectedActivityType === type.id}
                onClick={() => handleSelectActivityType(type.id)}
                type="button"
                disabled={currentActivity !== null}
              >
                {type.icon}
                <span>{type.name}</span>
              </ActivityTypeButton>
            ))}
          </ActivityTypeSelector>
          
          {currentActivity && (
            <ActivityForm>
              <ActivityFormTitle>
                Configure {activityTypes.find(t => t.id === currentActivity.type)?.name}
              </ActivityFormTitle>
              
              <FormGroup>
                <Label htmlFor="title">Activity Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={currentActivity.title}
                  onChange={handleActivityInputChange}
                  placeholder={`Enter a title for this ${currentActivity.type}`}
                  required
                />
                {errors.title && <ErrorText>{errors.title}</ErrorText>}
              </FormGroup>
              
              {currentActivity.type === 'poll' && (
                <FormGroup>
                  <Label>Options</Label>
                  <OptionsContainer>
                    {currentActivity.config.options?.map((option, index) => (
                      <OptionInput key={index}>
                        <Input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                        >
                          Remove
                        </Button>
                      </OptionInput>
                    ))}
                    <AddOptionButton
                      type="button"
                      onClick={handleAddOption}
                    >
                      + Add Option
                    </AddOptionButton>
                  </OptionsContainer>
                  {errors.options && <ErrorText>{errors.options}</ErrorText>}
                </FormGroup>
              )}
              
              {currentActivity.type === 'quiz' && (
                <FormGroup>
                  <Label>Questions</Label>
                  {currentActivity.config.questions?.map((question, questionIndex) => (
                    <div key={questionIndex} style={{
                      marginBottom: '2rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <Label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                        Question {questionIndex + 1}
                      </Label>
                      <Input
                        type="text"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                        placeholder="Enter question text"
                        style={{ marginBottom: '1rem' }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <Label style={{ margin: 0 }}>Answer Options</Label>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>
                          Click the circle to mark correct answer
                        </span>
                      </div>
                      <OptionsContainer>
                        {question.options.map((option, optionIndex) => (
                          <OptionInput key={optionIndex} style={{ alignItems: 'center' }}>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: question.correctIndex === optionIndex ? '#22c55e20' : 'transparent',
                                border: question.correctIndex === optionIndex ? '2px solid #22c55e' : '2px solid transparent'
                              }}
                              title={question.correctIndex === optionIndex ? 'Correct answer' : 'Click to mark as correct'}
                            >
                              <input
                                type="radio"
                                name={`correct_${questionIndex}`}
                                checked={question.correctIndex === optionIndex}
                                onChange={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                                style={{ marginRight: '8px', width: '18px', height: '18px', accentColor: '#22c55e' }}
                              />
                              {question.correctIndex === optionIndex && (
                                <span style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.75rem', marginRight: '8px' }}>
                                  CORRECT
                                </span>
                              )}
                            </label>
                            <Input
                              type="text"
                              value={option}
                              onChange={(e) => handleQuizOptionChange(questionIndex, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="button"
                              onClick={() => handleRemoveQuizOption(questionIndex, optionIndex)}
                              style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                            >
                              Remove
                            </Button>
                          </OptionInput>
                        ))}
                        <AddOptionButton
                          type="button"
                          onClick={() => handleAddQuizOption(questionIndex)}
                        >
                          + Add Option
                        </AddOptionButton>
                      </OptionsContainer>
                      {question.correctIndex === null && question.options.length > 0 && (
                        <ErrorText style={{ marginTop: '0.5rem' }}>
                          Please select the correct answer
                        </ErrorText>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    style={{ marginTop: '1rem' }}
                  >
                    + Add Another Question
                  </Button>
                  {errors.questions && <ErrorText>{errors.questions}</ErrorText>}
                </FormGroup>
              )}
              
              <ButtonGroup>
                <Button
                  type="button"
                  onClick={() => {
                    setCurrentActivity(null);
                    setSelectedActivityType(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  primary
                  onClick={handleSaveActivity}
                >
                  Add to Presentation
                </Button>
              </ButtonGroup>
            </ActivityForm>
          )}
          
          
          {activities.length > 0 && (
            <ActivitiesList>
              {activities.map((activity, index) => {
                const activityType = activityTypes.find(t => t.id === activity.type);
                return (
                  <ActivityItem key={activity.id}>
                    <ActivityInfo>
                      {activityType?.icon}
                      <ActivityName>
                        {activity.title || `${activityType?.name} ${index + 1}`}
                      </ActivityName>
                    </ActivityInfo>
                    <RemoveButton onClick={() => handleRemoveActivity(index)}>
                      Remove
                    </RemoveButton>
                  </ActivityItem>
                );
              })}
            </ActivitiesList>
          )}
          
          {activities.length === 0 && !currentActivity && (
            <EmptyActivities>
              No activities added yet. Select an activity type above to add one.
            </EmptyActivities>
          )}
        </ActivitiesSection>
        
        <ButtonGroup>
          <Button type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" primary disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Presentation'}
          </Button>
        </ButtonGroup>
      </Form>
      
      {isSubmitting && (
        <LoadingOverlay>
          <div>Creating presentation...</div>
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default CreatePresentation;