import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PollEditor from './ActivityEditors/PollEditor';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #388e3c;
  }
`;

const RemoveButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  ${props => props.$secondary && `
    background-color: #e0e0e0;
    border: 1px solid #ccc;
    color: #333;
    
    &:hover {
      background-color: #d5d5d5;
    }
  `}
  
  ${props => props.$primary && `
    background-color: #2196f3;
    border: 1px solid #1976d2;
    color: white;
    
    &:hover {
      background-color: #1976d2;
    }
  `}
`;

// Quiz-specific editor component
const QuizEditor = ({ config, onChange }) => {
  const [questions, setQuestions] = useState(config?.questions || [
    { text: '', options: ['', ''], correctIndex: 0 }
  ]);
  
  useEffect(() => {
    onChange({ questions });
  }, [questions, onChange]);
  
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', ''], correctIndex: 0 }
    ]);
  };
  
  const handleRemoveQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };
  
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'text') {
      newQuestions[index].text = value;
    } else if (field === 'correctIndex') {
      newQuestions[index].correctIndex = parseInt(value, 10);
    }
    setQuestions(newQuestions);
  };
  
  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };
  
  const handleRemoveOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    
    // Adjust correctIndex if needed
    if (newQuestions[questionIndex].correctIndex >= optionIndex &&
        newQuestions[questionIndex].correctIndex > 0) {
      newQuestions[questionIndex].correctIndex--;
    }
    
    setQuestions(newQuestions);
  };
  
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };
  
  return (
    <>
      {questions.map((question, qIndex) => (
        <div key={qIndex} style={{ marginBottom: '32px', padding: '16px', border: '1px solid #eee', borderRadius: '8px' }}>
          <FormGroup>
            <Label>Question {qIndex + 1}</Label>
            <Input
              value={question.text}
              onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
              placeholder="Enter your question"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Options</Label>
            <OptionsContainer>
              {question.options.map((option, oIndex) => (
                <OptionItem key={oIndex}>
                  <input
                    type="radio"
                    checked={question.correctIndex === oIndex}
                    onChange={() => handleQuestionChange(qIndex, 'correctIndex', oIndex)}
                  />
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    style={{ flex: 1 }}
                  />
                  {question.options.length > 2 && (
                    <RemoveButton 
                      type="button"
                      onClick={() => handleRemoveOption(qIndex, oIndex)}
                    >
                      Remove
                    </RemoveButton>
                  )}
                </OptionItem>
              ))}
              <AddButton type="button" onClick={() => handleAddOption(qIndex)}>
                Add Option
              </AddButton>
            </OptionsContainer>
          </FormGroup>
          
          {questions.length > 1 && (
            <RemoveButton 
              type="button"
              onClick={() => handleRemoveQuestion(qIndex)}
              style={{ marginTop: '16px' }}
            >
              Remove Question
            </RemoveButton>
          )}
        </div>
      ))}
      
      <AddButton type="button" onClick={handleAddQuestion}>
        Add Question
      </AddButton>
    </>
  );
};

// WordCloud-specific editor component
const WordCloudEditor = ({ config, onChange }) => {
  const [prompt, setPrompt] = useState(config?.prompt || '');
  const [maxWords, setMaxWords] = useState(config?.maxWords || 10);
  
  useEffect(() => {
    onChange({ prompt, maxWords });
  }, [prompt, maxWords, onChange]);
  
  return (
    <>
      <FormGroup>
        <Label htmlFor="prompt">Prompt</Label>
        <Input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your word cloud prompt"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="maxWords">Maximum Words Per Participant</Label>
        <Input
          id="maxWords"
          type="number"
          min="1"
          max="50"
          value={maxWords}
          onChange={(e) => setMaxWords(parseInt(e.target.value, 10))}
        />
      </FormGroup>
    </>
  );
};

// QA-specific editor component
const QAEditor = ({ config, onChange }) => {
  const [topic, setTopic] = useState(config?.topic || '');
  const [description, setDescription] = useState(config?.description || '');
  
  useEffect(() => {
    onChange({ topic, description });
  }, [topic, description, onChange]);
  
  return (
    <>
      <FormGroup>
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter the Q&A topic"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what participants should ask about"
        />
      </FormGroup>
    </>
  );
};

const ActivityEditModal = ({ activity, onSave, onClose }) => {
  console.log('ActivityEditModal received activity:', activity);
  
  // Store the activity type in state to prevent it from being lost across re-renders
  const [activityType, setActivityType] = useState('');
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState({});
  const [mode, setMode] = useState('edit');
  const [originalId, setOriginalId] = useState(''); // Store the ID separately to ensure it's not lost
  
  // Initialize all state values from the activity on component mount and when activity changes
  useEffect(() => {
    console.log('Activity in useEffect:', activity);
    if (activity) {
      console.log('Setting from activity with ID:', activity.id);
      setOriginalId(activity.id); // Store ID separately
      setActivityType(activity.type || 'poll');
      setTitle(activity.title || '');
      setConfig(activity.config || {});
      setMode(activity.mode || 'edit');
    }
  }, [activity]);
  
  // Log the detected type
  console.log('Current activityType state:', activityType);
  console.log('Original ID:', originalId);
  
  // Stop event propagation and handle form submission
  const handleSave = (e) => {
    console.log('[ActivityEditModal] handleSave fired');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[ActivityEditModal] Original activity before update:', activity);
    
    // Make sure we have a valid activity object with an ID
    if (!activity) {
      console.error('[ActivityEditModal] Invalid original activity:', activity);
      return;
    }
    
    // Use the originalId if activity.id is not available (as a backup)
    const activityId = activity.id || originalId;
    
    if (!activityId) {
      console.error('[ActivityEditModal] Cannot update activity without an ID');
      return;
    }
    
    // Create a proper copy of the original activity to avoid reference issues
    const updatedActivity = {
      // First, ensure we include ALL properties from the original activity
      ...activity,
      // Then override with our updated values
      id: activityId, // Explicitly include the ID
      title,
      type: activityType,  // Explicitly include the activity type
      config,
      mode
    };
    
    console.log('[ActivityEditModal] Sending updated activity to parent:', updatedActivity);
    console.log('[ActivityEditModal] Activity ID check:', updatedActivity.id);
    
    if (typeof onSave === 'function') {
      console.log('[ActivityEditModal] onSave is a function, calling onSave');
      onSave(updatedActivity);
    } else {
      console.error('[ActivityEditModal] onSave is not a function:', onSave);
    }
  };
  
  // Handle modal close with prevention of propagation
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  const renderEditor = () => {
    // Log before switch to help debug
    console.log('renderEditor called with activityType:', activityType);
    
    // Make the switch case more explicit for better debugging
    // Include toLowerCase() for case-insensitive matching
    const type = String(activityType).toLowerCase();
    console.log('Normalized activity type for switch:', type);
    
    switch (type) {
      case 'poll':
        console.log('Rendering PollEditor');
        return <PollEditor activity={config} onChange={setConfig} mode="edit" />;
      case 'quiz':
        console.log('Rendering QuizEditor');
        return <QuizEditor config={config} onChange={setConfig} />;
      case 'wordcloud':
        console.log('Rendering WordCloudEditor');
        return <WordCloudEditor config={config} onChange={setConfig} />;
      case 'qa':
        console.log('Rendering QAEditor');
        return <QAEditor config={config} onChange={setConfig} />;
      default:
        console.log('No matching editor found for type:', type);
        return <p>Unsupported activity type: {activityType}</p>;
    }
  };
  
  return (
    <ModalOverlay onClick={handleClose}>
      {/* Stop click propagation to prevent closing when clicking inside the modal */}
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit {activityType.charAt(0).toUpperCase() + activityType.slice(1)} Activity: {title}</ModalTitle>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSave}>
          <FormGroup>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter activity title"
              required
            />
          </FormGroup>
          
          {renderEditor()}
          
          <FormGroup>
            <Label>Settings Behavior</Label>
            <div style={{ marginTop: '8px' }}>
              <Label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
                <input 
                  type="radio" 
                  name="mode" 
                  value="edit" 
                  checked={mode === 'edit'} 
                  onChange={() => setMode('edit')} 
                  style={{ marginRight: '8px' }}
                />
                Allow settings to be changed during activity creation and editing only
              </Label>
              <Label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="mode" 
                  value="present" 
                  checked={mode === 'present'} 
                  onChange={() => setMode('present')} 
                  style={{ marginRight: '8px' }}
                />
                Allow settings to be changed during presentation
              </Label>
            </div>
          </FormGroup>
          
          <ButtonGroup>
            <Button type="button" $secondary onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" $primary onClick={(e) => { console.log('[ActivityEditModal] Save button clicked'); handleSave(e); }}>
              Save
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ActivityEditModal;