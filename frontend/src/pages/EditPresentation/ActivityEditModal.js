import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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
  
  ${props => props.secondary && `
    background-color: #e0e0e0;
    border: 1px solid #ccc;
    color: #333;
    
    &:hover {
      background-color: #d5d5d5;
    }
  `}
  
  ${props => props.primary && `
    background-color: #2196f3;
    border: 1px solid #1976d2;
    color: white;
    
    &:hover {
      background-color: #1976d2;
    }
  `}
`;

// Poll-specific editor component
const PollEditor = ({ config, onChange }) => {
  const [question, setQuestion] = useState(config?.question || '');
  const [options, setOptions] = useState(config?.options || ['', '']);
  
  useEffect(() => {
    onChange({ question, options });
  }, [question, options, onChange]);
  
  const handleAddOption = () => {
    setOptions([...options, '']);
  };
  
  const handleRemoveOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  return (
    <>
      <FormGroup>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your poll question"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Options</Label>
        <OptionsContainer>
          {options.map((option, index) => (
            <OptionItem key={index}>
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ flex: 1 }}
              />
              {options.length > 2 && (
                <RemoveButton 
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                >
                  Remove
                </RemoveButton>
              )}
            </OptionItem>
          ))}
          <AddButton type="button" onClick={handleAddOption}>
            Add Option
          </AddButton>
        </OptionsContainer>
      </FormGroup>
    </>
  );
};

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
  const [title, setTitle] = useState(activity?.title || '');
  const [config, setConfig] = useState(activity?.config || {});
  const activityType = activity?.type || 'poll';
  
  const handleSave = (e) => {
    e.preventDefault();
    
    const updatedActivity = {
      ...activity,
      title,
      config
    };
    
    onSave(updatedActivity);
  };
  
  const renderEditor = () => {
    switch (activityType) {
      case 'poll':
        return <PollEditor config={config} onChange={setConfig} />;
      case 'quiz':
        return <QuizEditor config={config} onChange={setConfig} />;
      case 'wordcloud':
        return <WordCloudEditor config={config} onChange={setConfig} />;
      case 'qa':
        return <QAEditor config={config} onChange={setConfig} />;
      default:
        return <p>Unsupported activity type</p>;
    }
  };
  
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Edit {activityType.charAt(0).toUpperCase() + activityType.slice(1)}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
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
          
          <ButtonGroup>
            <Button type="button" secondary onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" primary>
              Save Changes
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ActivityEditModal; 