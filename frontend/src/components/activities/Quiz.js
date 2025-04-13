import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const QuizContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  width: 100%;
`;

const QuizHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const QuizTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const QuizDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  margin: ${({ theme }) => theme.spacing.md} 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${({ progress }) => `${progress}%`};
  transition: width 0.3s ease;
`;

const QuestionCounter = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const QuestionContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuestionText = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const OptionButton = styled.button`
  background-color: ${({ theme, selected, correct, incorrect, isRevealed }) => {
    if (!isRevealed) return selected ? theme.colors.primary : theme.colors.background.secondary;
    if (correct) return theme.colors.accent;
    if (incorrect) return theme.colors.error + '80';
    return theme.colors.background.secondary;
  }};
  color: ${({ theme, selected, correct, isRevealed }) => {
    if (!isRevealed) return selected ? theme.colors.text.light : theme.colors.text.primary;
    if (correct || (selected && correct)) return '#FFFFFF';
    return theme.colors.text.primary;
  }};
  border: ${({ theme, selected, correct, incorrect, isRevealed }) => {
    if (!isRevealed) return selected ? 'none' : `1px solid ${theme.colors.border}`;
    if (correct) return `1px solid ${theme.colors.accent}`;
    if (incorrect && selected) return `1px solid ${theme.colors.error}`;
    return `1px solid ${theme.colors.border}`;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.body};
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: ${({ theme, selected, isRevealed }) => {
      if (isRevealed) return;
      return selected ? theme.colors.primary : theme.colors.background.secondary + 'DD';
    }};
    transform: ${({ isRevealed }) => isRevealed ? 'none' : 'translateY(-2px)'};
  }
  
  &:disabled {
    opacity: ${({ correct }) => correct ? 1 : 0.7};
    cursor: default;
    transform: none;
  }
`;

const OptionLabel = styled.span`
  font-weight: 600;
  margin-right: ${({ theme }) => theme.spacing.sm};
  display: inline-block;
`;

const ResultIndicator = styled.div`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.md};
  transform: translateY(-50%);
`;

const FeedbackMessage = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme, isCorrect }) => 
    isCorrect ? 'rgba(111, 207, 151, 0.1)' : 'rgba(235, 87, 87, 0.1)'};
  color: ${({ theme, isCorrect }) => 
    isCorrect ? theme.colors.accent : theme.colors.error};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const NavigationButton = styled.button`
  background-color: ${({ theme, isPrimary }) => 
    isPrimary ? theme.colors.primary : 'transparent'};
  color: ${({ theme, isPrimary }) => 
    isPrimary ? theme.colors.text.light : theme.colors.text.primary};
  border: ${({ theme, isPrimary }) => 
    isPrimary ? 'none' : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, isPrimary }) => 
      isPrimary ? theme.colors.primary + 'DD' : theme.colors.background.secondary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ScoreContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const ScoreTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ScoreValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ScoreMessage = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.h5};
`;

const ScoreDetails = styled.div`
  display: inline-block;
  margin: 0 auto;
  text-align: left;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const ScoreDetail = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const LeaderboardTitle = styled.h3`
  margin: ${({ theme }) => `${theme.spacing.xl} 0 ${theme.spacing.md}`};
  text-align: center;
`;

const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const LeaderboardHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const LeaderboardHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: left;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const LeaderboardBody = styled.tbody``;

const LeaderboardRow = styled.tr`
  &:nth-child(even) {
    background-color: ${({ theme }) => theme.colors.background.secondary + '50'};
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`;

const LeaderboardCell = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme, highlight }) => highlight ? theme.colors.primary : 'inherit'};
  font-weight: ${({ highlight }) => highlight ? 600 : 400};
`;

/**
 * Quiz Component
 * @param {Object} props
 * @param {string} props.id - Quiz ID
 * @param {string} props.title - Quiz title
 * @param {string} props.description - Quiz description
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {Array} props.questions - Quiz questions
 * @param {boolean} props.showResults - Whether to show results immediately after answering
 * @param {boolean} props.showLeaderboard - Whether to show leaderboard
 * @param {Array} props.leaderboard - Leaderboard data
 * @param {Object} props.user - Current user information
 * @param {function} props.onSubmit - Function called when user submits an answer
 * @param {function} props.onComplete - Function called when user completes the quiz
 */
const Quiz = ({
  id,
  title = "Quiz",
  description = "Test your knowledge",
  isPresenter = false,
  questions = [],
  showResults = true,
  showLeaderboard = true,
  leaderboard = [],
  user = { id: 'user1', name: 'Anonymous' },
  onSubmit,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState({
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    total: questions.length,
    percentage: 0
  });
  
  // Update score when quiz is completed
  useEffect(() => {
    if (quizCompleted) {
      const results = {
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        total: questions.length
      };
      
      questions.forEach((question, index) => {
        if (selectedAnswers[index] === undefined) {
          results.unanswered++;
        } else if (selectedAnswers[index] === question.correctOptionIndex) {
          results.correct++;
        } else {
          results.incorrect++;
        }
      });
      
      results.percentage = Math.round((results.correct / results.total) * 100);
      setScore(results);
      
      if (onComplete) {
        onComplete(id, {
          userId: user.id,
          userName: user.name,
          score: results.percentage,
          correctAnswers: results.correct,
          totalQuestions: results.total
        });
      }
    }
  }, [quizCompleted, questions, selectedAnswers, id, user, onComplete]);
  
  // Handle option selection
  const handleOptionSelect = (questionIndex, optionIndex) => {
    // Don't allow changing answers after they're revealed
    if (revealedAnswers[questionIndex]) {
      return;
    }
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
    
    if (showResults) {
      setRevealedAnswers(prev => ({
        ...prev,
        [questionIndex]: true
      }));
      
      // Call onSubmit with the selected answer
      if (onSubmit) {
        onSubmit(id, {
          userId: user.id,
          questionIndex,
          selectedOptionIndex: optionIndex,
          isCorrect: questions[questionIndex].correctOptionIndex === optionIndex
        });
      }
    }
  };
  
  // Navigation handlers
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // If we're using immediate feedback, check if all questions are answered
      if (showResults) {
        const answeredCount = Object.keys(selectedAnswers).length;
        if (answeredCount < questions.length) {
          // Find first unanswered question
          for (let i = 0; i < questions.length; i++) {
            if (selectedAnswers[i] === undefined) {
              setCurrentQuestion(i);
              return;
            }
          }
        }
      }
      
      // Complete the quiz
      setQuizCompleted(true);
      
      // If we're not showing immediate results, submit all answers at once
      if (!showResults && onSubmit) {
        questions.forEach((question, questionIndex) => {
          const answer = selectedAnswers[questionIndex];
          if (answer !== undefined) {
            onSubmit(id, {
              userId: user.id,
              questionIndex,
              selectedOptionIndex: answer,
              isCorrect: question.correctOptionIndex === answer
            });
          }
        });
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setQuizCompleted(false);
  };
  
  // Check if the current user is in the leaderboard
  const isUserInLeaderboard = leaderboard.some(entry => entry.userId === user.id);
  
  // Calculate progress
  const progress = (Object.keys(selectedAnswers).length / questions.length) * 100;
  
  // Generate feedback message
  const getFeedbackMessage = (questionIndex, isCorrect) => {
    if (isCorrect) {
      return "Correct! Well done!";
    } else {
      const correctOptionLabel = String.fromCharCode(65 + questions[questionIndex].correctOptionIndex);
      return `Incorrect. The correct answer is ${correctOptionLabel}.`;
    }
  };
  
  // Render quiz results
  if (quizCompleted) {
    return (
      <QuizContainer>
        <ScoreContainer>
          <ScoreTitle>Quiz Results</ScoreTitle>
          <ScoreValue>{score.percentage}%</ScoreValue>
          <ScoreMessage>
            {score.percentage === 100 && "Perfect score! Excellent job!"}
            {score.percentage >= 80 && score.percentage < 100 && "Great job!"}
            {score.percentage >= 60 && score.percentage < 80 && "Good effort!"}
            {score.percentage < 60 && "Keep practicing, you'll improve!"}
          </ScoreMessage>
          
          <ScoreDetails>
            <ScoreDetail>
              <span>Correct answers:</span>
              <span>{score.correct}</span>
            </ScoreDetail>
            <ScoreDetail>
              <span>Incorrect answers:</span>
              <span>{score.incorrect}</span>
            </ScoreDetail>
            {score.unanswered > 0 && (
              <ScoreDetail>
                <span>Unanswered questions:</span>
                <span>{score.unanswered}</span>
              </ScoreDetail>
            )}
            <ScoreDetail>
              <span>Total questions:</span>
              <span>{score.total}</span>
            </ScoreDetail>
          </ScoreDetails>
          
          {showLeaderboard && leaderboard.length > 0 && (
            <>
              <LeaderboardTitle>Leaderboard</LeaderboardTitle>
              <LeaderboardTable>
                <LeaderboardHeader>
                  <tr>
                    <LeaderboardHeaderCell>Rank</LeaderboardHeaderCell>
                    <LeaderboardHeaderCell>Name</LeaderboardHeaderCell>
                    <LeaderboardHeaderCell>Score</LeaderboardHeaderCell>
                  </tr>
                </LeaderboardHeader>
                <LeaderboardBody>
                  {leaderboard
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((entry, index) => (
                      <LeaderboardRow key={entry.userId}>
                        <LeaderboardCell>{index + 1}</LeaderboardCell>
                        <LeaderboardCell highlight={entry.userId === user.id}>
                          {entry.userName} {entry.userId === user.id && "(You)"}
                        </LeaderboardCell>
                        <LeaderboardCell highlight={entry.userId === user.id}>
                          {entry.score}%
                        </LeaderboardCell>
                      </LeaderboardRow>
                    ))}
                  {!isUserInLeaderboard && (
                    <LeaderboardRow>
                      <LeaderboardCell colSpan="3" style={{ textAlign: 'center' }}>
                        Your score will appear here after the presenter ends the quiz.
                      </LeaderboardCell>
                    </LeaderboardRow>
                  )}
                </LeaderboardBody>
              </LeaderboardTable>
            </>
          )}
          
          <ButtonContainer>
            <NavigationButton onClick={handleRestart}>
              Restart Quiz
            </NavigationButton>
          </ButtonContainer>
        </ScoreContainer>
      </QuizContainer>
    );
  }
  
  // Render quiz questions
  const question = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const isAnswerRevealed = revealedAnswers[currentQuestion];
  const isAnswerCorrect = selectedAnswer === question.correctOptionIndex;
  
  return (
    <QuizContainer>
      <QuizHeader>
        <QuizTitle>{title}</QuizTitle>
        <QuizDescription>{description}</QuizDescription>
      </QuizHeader>
      
      {!isPresenter && (
        <>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
          
          <QuestionCounter>
            Question {currentQuestion + 1} of {questions.length}
          </QuestionCounter>
          
          <QuestionContainer>
            <QuestionText>{question.text}</QuestionText>
            
            <OptionsGrid>
              {question.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctOptionIndex;
                const isIncorrect = isAnswerRevealed && isSelected && !isCorrect;
                
                return (
                  <OptionButton
                    key={index}
                    selected={isSelected}
                    correct={isAnswerRevealed && isCorrect}
                    incorrect={isIncorrect}
                    isRevealed={isAnswerRevealed}
                    onClick={() => handleOptionSelect(currentQuestion, index)}
                    disabled={isAnswerRevealed}
                  >
                    <OptionLabel>{optionLabel}.</OptionLabel> {option}
                    {isAnswerRevealed && isCorrect && (
                      <ResultIndicator>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </ResultIndicator>
                    )}
                    {isAnswerRevealed && isIncorrect && (
                      <ResultIndicator>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </ResultIndicator>
                    )}
                  </OptionButton>
                );
              })}
            </OptionsGrid>
            
            {isAnswerRevealed && (
              <FeedbackMessage isCorrect={isAnswerCorrect}>
                {getFeedbackMessage(currentQuestion, isAnswerCorrect)}
              </FeedbackMessage>
            )}
          </QuestionContainer>
          
          <ButtonContainer>
            <NavigationButton
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </NavigationButton>
            
            <NavigationButton
              onClick={handleNext}
              isPrimary
              disabled={selectedAnswer === undefined && !showResults}
            >
              {currentQuestion < questions.length - 1 ? 'Next' : 'Finish'}
            </NavigationButton>
          </ButtonContainer>
        </>
      )}
      
      {isPresenter && (
        <div style={{ textAlign: 'center' }}>
          <p>Presenter view: Participants are taking the quiz.</p>
          <p>Total questions: {questions.length}</p>
          {leaderboard.length > 0 && (
            <>
              <LeaderboardTitle>Live Leaderboard</LeaderboardTitle>
              <LeaderboardTable>
                <LeaderboardHeader>
                  <tr>
                    <LeaderboardHeaderCell>Rank</LeaderboardHeaderCell>
                    <LeaderboardHeaderCell>Name</LeaderboardHeaderCell>
                    <LeaderboardHeaderCell>Score</LeaderboardHeaderCell>
                  </tr>
                </LeaderboardHeader>
                <LeaderboardBody>
                  {leaderboard
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((entry, index) => (
                      <LeaderboardRow key={entry.userId}>
                        <LeaderboardCell>{index + 1}</LeaderboardCell>
                        <LeaderboardCell>{entry.userName}</LeaderboardCell>
                        <LeaderboardCell>{entry.score}%</LeaderboardCell>
                      </LeaderboardRow>
                    ))}
                </LeaderboardBody>
              </LeaderboardTable>
            </>
          )}
        </div>
      )}
    </QuizContainer>
  );
};

export default Quiz;