import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const QAContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  width: 100%;
`;

const Title = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const Description = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuestionInput = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.body};
  resize: vertical;
  min-height: 100px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.light};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  display: block;
  margin: 0 0 ${({ theme }) => theme.spacing.xl} auto;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + 'DD'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const QuestionsHeader = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`;

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const QuestionCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const QuestionAuthor = styled.span`
  font-weight: 500;
`;

const QuestionTime = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const QuestionText = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const QuestionActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VoteButton = styled.button`
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.text.secondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.primary};
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AdminButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme, highlight }) => highlight ? theme.colors.primary : theme.colors.text.secondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:hover {
    color: ${({ theme, danger }) => danger ? theme.colors.error : theme.colors.primary};
  }
`;

const SortContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    justify-content: flex-start;
  }
`;

const SortButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.text.secondary};
  font-weight: ${({ active }) => active ? '600' : '400'};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

/**
 * QA Component
 * @param {Object} props
 * @param {string} props.id - QA session ID
 * @param {string} props.title - Session title
 * @param {string} props.description - Session description
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {boolean} props.isModerated - Whether questions need approval
 * @param {Array} props.questions - Initial questions (if any)
 * @param {Object} props.user - Current user information
 * @param {function} props.onSubmit - Function called when user submits a question
 * @param {function} props.onUpvote - Function called when user upvotes a question
 * @param {function} props.onApprove - Function called when presenter approves a question
 * @param {function} props.onHighlight - Function called when presenter highlights a question
 * @param {function} props.onRemove - Function called when presenter removes a question
 */
const QA = ({ 
  id,
  title = "Q&A Session",
  description = "Ask your questions here",
  isPresenter = false,
  isModerated = true,
  questions = [],
  user = { id: 'user1', name: 'Anonymous' },
  onSubmit,
  onUpvote,
  onApprove,
  onHighlight,
  onRemove
}) => {
  const [questionInput, setQuestionInput] = useState('');
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [sortType, setSortType] = useState('popular'); // 'popular', 'newest', 'oldest'
  
  // Process and sort questions based on sort type and moderation settings
  useEffect(() => {
    let filteredQuestions = [...questions];
    
    // If not presenter and moderated, only show approved questions
    if (!isPresenter && isModerated) {
      filteredQuestions = filteredQuestions.filter(q => q.isApproved);
    }
    
    // Sort questions based on sort type
    switch(sortType) {
      case 'newest':
        filteredQuestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'oldest':
        filteredQuestions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'popular':
      default:
        filteredQuestions.sort((a, b) => b.votes - a.votes);
        break;
    }
    
    // Move highlighted questions to the top
    if (isPresenter || !isModerated) {
      const highlightedQuestions = filteredQuestions.filter(q => q.isHighlighted);
      const regularQuestions = filteredQuestions.filter(q => !q.isHighlighted);
      filteredQuestions = [...highlightedQuestions, ...regularQuestions];
    }
    
    setDisplayedQuestions(filteredQuestions);
  }, [questions, sortType, isPresenter, isModerated]);
  
  const handleQuestionChange = (e) => {
    setQuestionInput(e.target.value);
  };
  
  const handleSubmit = () => {
    if (questionInput.trim()) {
      const newQuestion = {
        id: `q_${Date.now()}`,
        text: questionInput.trim(),
        author: user.name,
        authorId: user.id,
        timestamp: new Date().toISOString(),
        votes: 0,
        isApproved: !isModerated, // Auto-approve if not moderated
        isHighlighted: false,
        voters: []
      };
      
      // Call parent onSubmit function
      if (onSubmit) {
        onSubmit(newQuestion);
      }
      
      setQuestionInput('');
    }
  };
  
  const handleUpvote = (questionId) => {
    if (onUpvote) {
      onUpvote(id, questionId, user.id);
    }
  };
  
  const handleApprove = (questionId) => {
    if (onApprove) {
      onApprove(id, questionId);
    }
  };
  
  const handleHighlight = (questionId) => {
    if (onHighlight) {
      onHighlight(id, questionId);
    }
  };
  
  const handleRemove = (questionId) => {
    if (onRemove) {
      onRemove(id, questionId);
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const hasUserVoted = (question) => {
    return question.voters && question.voters.includes(user.id);
  };
  
  return (
    <QAContainer>
      <Title>{title}</Title>
      <Description>{description}</Description>
      
      {!isPresenter && (
        <>
          <QuestionInput 
            placeholder="Type your question here..."
            value={questionInput}
            onChange={handleQuestionChange}
          />
          <SubmitButton 
            onClick={handleSubmit}
            disabled={!questionInput.trim()}
          >
            Submit Question
          </SubmitButton>
        </>
      )}
      
      <QuestionsHeader>Questions {displayedQuestions.length > 0 && `(${displayedQuestions.length})`}</QuestionsHeader>
      
      {displayedQuestions.length > 0 && (
        <SortContainer>
          <SortButton 
            active={sortType === 'popular'}
            onClick={() => setSortType('popular')}
          >
            Popular
          </SortButton>
          <SortButton 
            active={sortType === 'newest'}
            onClick={() => setSortType('newest')}
          >
            Newest
          </SortButton>
          <SortButton 
            active={sortType === 'oldest'}
            onClick={() => setSortType('oldest')}
          >
            Oldest
          </SortButton>
        </SortContainer>
      )}
      
      <QuestionsList>
        {displayedQuestions.length > 0 ? (
          displayedQuestions.map(question => (
            <QuestionCard 
              key={question.id}
              style={{ 
                backgroundColor: question.isHighlighted ? 'rgba(47, 128, 237, 0.1)' : undefined,
                borderLeft: question.isHighlighted ? '4px solid #2F80ED' : undefined
              }}
            >
              <QuestionHeader>
                <QuestionAuthor>{question.author}</QuestionAuthor>
                <QuestionTime>{formatTime(question.timestamp)}</QuestionTime>
              </QuestionHeader>
              <QuestionText>{question.text}</QuestionText>
              <QuestionActions>
                <VoteButton 
                  onClick={() => handleUpvote(question.id)}
                  active={hasUserVoted(question)}
                  disabled={hasUserVoted(question)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 14H20L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {question.votes}
                </VoteButton>
                
                {isPresenter && (
                  <AdminActions>
                    {isModerated && !question.isApproved && (
                      <AdminButton onClick={() => handleApprove(question.id)}>
                        Approve
                      </AdminButton>
                    )}
                    <AdminButton 
                      highlight={question.isHighlighted}
                      onClick={() => handleHighlight(question.id)}
                    >
                      {question.isHighlighted ? 'Unhighlight' : 'Highlight'}
                    </AdminButton>
                    <AdminButton danger onClick={() => handleRemove(question.id)}>
                      Remove
                    </AdminButton>
                  </AdminActions>
                )}
              </QuestionActions>
            </QuestionCard>
          ))
        ) : (
          <EmptyState>
            {isPresenter ? 
              'No questions have been submitted yet.' : 
              'Be the first to ask a question!'}
          </EmptyState>
        )}
      </QuestionsList>
    </QAContainer>
  );
};

export default QA;