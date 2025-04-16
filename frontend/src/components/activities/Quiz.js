import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CountdownTimer from './CountdownTimer';
import SettingsIcon from '../icons/SettingsIcon';

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
    isCorrect ? theme.colors.accent + '20' : theme.colors.error + '20'};
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
  font-size: ${({ theme }) => theme.fontSizes.body};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, isPrimary }) => 
      isPrimary ? theme.colors.primary + 'DD' : theme.colors.background.secondary};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ResultsTitle = styled.h3`
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
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    padding-top: ${({ theme }) => theme.spacing.sm};
    font-weight: 600;
  }
`;

const LeaderboardTitle = styled.h3`
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.primary};
`;

const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const LeaderboardHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const LeaderboardHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.sm};
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

const TimerSettingsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const TimerSettingsTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const TimerSettingsToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary + 'DD'};
  }
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
`;

const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FormInput = styled.input`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FormSelect = styled.select`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.small};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FormCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const FormCheckbox = styled.input`
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Quiz Component
 * @param {Object} props
 * @param {string} props.id - Quiz ID
 * @param {string} props.title - Quiz title
 * @param {string} props.description - Quiz description
 * @param {Array} props.questions - Array of question objects
 * @param {boolean} props.isPresenter - Whether current user is presenter
 * @param {boolean} props.showResults - Whether to show results immediately
 * @param {boolean} props.showLeaderboard - Whether to show leaderboard
 * @param {Array} props.leaderboard - Array of leaderboard entries
 * @param {Object} props.user - Current user object
 * @param {Object} props.timerSettings - Timer settings object
 * @param {function} props.onSubmit - Function called when an answer is submitted
 * @param {function} props.onComplete - Function called when quiz is completed
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
  timerSettings: initialTimerSettings = {
    enabled: false,
    duration: 30,
    autoAdvance: true,
    timeBasedScoring: true
  },
  onSubmit,
  onComplete,
  onTimerSettingsChange
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(undefined));
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [timerSettings, setTimerSettings] = useState(initialTimerSettings);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  
  // Reset state when questions change
  useEffect(() => {
    setCurrentQuestion(0);
    setUserAnswers(Array(questions.length).fill(undefined));
    setIsAnswerRevealed(false);
    setQuizCompleted(false);
    setScore(0);
  }, [questions]);
  
  // Reset timer when current question changes
  useEffect(() => {
    if (timerSettings.enabled) {
      setQuestionTimeLeft(timerSettings.duration);
    }
  }, [currentQuestion, timerSettings]);
  
  const selectedAnswer = userAnswers[currentQuestion];
  const currentQuestionData = questions[currentQuestion];
  const correctAnswerIndex = currentQuestionData?.correctAnswer;
  const isAnswerCorrect = selectedAnswer === correctAnswerIndex;
  
  const totalCorrect = userAnswers.reduce((count, answer, index) => {
    const question = questions[index];
    return answer === question?.correctAnswer ? count + 1 : count;
  }, 0);
  
  const progressPercentage = Math.round((currentQuestion / questions.length) * 100);
  
  // Handle option selection
  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (questionIndex !== currentQuestion) return;
    if (isAnswerRevealed) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
    
    if (showResults) {
      setIsAnswerRevealed(true);
      
      // If timer is enabled and time-based scoring is enabled, calculate score based on time left
      const timeBonus = timerSettings.enabled && timerSettings.timeBasedScoring 
        ? Math.round((questionTimeLeft / timerSettings.duration) * 50) // Up to 50% bonus for quick answers
        : 0;
      
      if (onSubmit) {
        onSubmit({
          quizId: id,
          questionIndex,
          selectedOption: optionIndex,
          isCorrect: optionIndex === correctAnswerIndex,
          timeBonus
        });
      }
    } else if (timerSettings.enabled && timerSettings.autoAdvance) {
      // If auto-advance is enabled, move to next question after selection
      setTimeout(() => {
        handleNext();
      }, 250); // Small delay for better UX
    }
  };
  
  // Navigation handlers
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      // Move to next question
      if (showResults) {
        setIsAnswerRevealed(false);
      }
      setCurrentQuestion(prevQuestion => prevQuestion + 1);
    } else {
      // Quiz completed
      if (!quizCompleted) {
        const finalScore = Math.round((totalCorrect / questions.length) * 100);
        setScore(finalScore);
        setQuizCompleted(true);
        
        if (onComplete) {
          onComplete({
            quizId: id,
            userId: user.id,
            userName: user.name,
            score: finalScore,
            answers: userAnswers
          });
        }
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prevQuestion => prevQuestion - 1);
      if (showResults) {
        setIsAnswerRevealed(userAnswers[currentQuestion - 1] !== undefined);
      }
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestion(0);
    setUserAnswers(Array(questions.length).fill(undefined));
    setIsAnswerRevealed(false);
    setQuizCompleted(false);
    setScore(0);
  };
  
  // Handle timer completion
  const handleTimerComplete = () => {
    if (timerSettings.autoAdvance) {
      // If no answer selected, mark as wrong and move on
      if (selectedAnswer === undefined) {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = -1; // -1 indicates time expired without answer
        setUserAnswers(newAnswers);
        
        if (onSubmit) {
          onSubmit({
            quizId: id,
            questionIndex: currentQuestion,
            selectedOption: -1,
            isCorrect: false,
            timeBonus: 0
          });
        }
      }
      
      // Reveal answer briefly before advancing
      if (showResults) {
        setIsAnswerRevealed(true);
        setTimeout(() => {
          handleNext();
        }, 1500); // Show correct answer for 1.5 seconds before advancing
      } else {
        handleNext();
      }
    }
  };
  
  // Handle timer settings change
  const handleTimerSettingChange = (key, value) => {
    const newSettings = { 
      ...timerSettings,
      [key]: typeof value === 'string' && !isNaN(parseInt(value)) ? parseInt(value) : value
    };
    
    setTimerSettings(newSettings);
    
    if (onTimerSettingsChange) {
      onTimerSettingsChange(newSettings);
    }
  };
  
  // Generate feedback message
  const getFeedbackMessage = (questionIndex, isCorrect) => {
    const question = questions[questionIndex];
    
    if (isCorrect) {
      return question?.correctFeedback || "Correct!";
    } else {
      const correctOption = question?.options[question.correctAnswer];
      return question?.incorrectFeedback || `Incorrect. The correct answer is: ${correctOption}`;
    }
  };
  
  if (isPresenter) {
    return (
      <QuizContainer>
        <QuizHeader>
          <QuizTitle>{title}</QuizTitle>
          <QuizDescription>{description}</QuizDescription>
        </QuizHeader>
        
        <TimerSettingsContainer>
          <TimerSettingsTitle>
            <SettingsIcon /> Timer Settings
          </TimerSettingsTitle>
          
          <FormGroup>
            <FormCheckboxContainer>
              <FormCheckbox
                type="checkbox"
                id="timer-enabled"
                checked={timerSettings.enabled}
                onChange={(e) => handleTimerSettingChange('enabled', e.target.checked)}
              />
              <FormLabel htmlFor="timer-enabled">Enable Timer</FormLabel>
            </FormCheckboxContainer>
          </FormGroup>
          
          <FormGroup>
            <FormLabel htmlFor="timer-duration">Duration (seconds)</FormLabel>
            <FormInput
              id="timer-duration"
              type="number"
              min="5"
              max="300"
              value={timerSettings.duration}
              onChange={(e) => handleTimerSettingChange('duration', e.target.value)}
              disabled={!timerSettings.enabled}
            />
          </FormGroup>
          
          <FormGroup>
            <FormCheckboxContainer>
              <FormCheckbox
                type="checkbox"
                id="auto-advance"
                checked={timerSettings.autoAdvance}
                onChange={(e) => handleTimerSettingChange('autoAdvance', e.target.checked)}
                disabled={!timerSettings.enabled}
              />
              <FormLabel htmlFor="auto-advance">Auto-advance when time expires</FormLabel>
            </FormCheckboxContainer>
          </FormGroup>
          
          <FormGroup>
            <FormCheckboxContainer>
              <FormCheckbox
                type="checkbox"
                id="time-based-scoring"
                checked={timerSettings.timeBasedScoring}
                onChange={(e) => handleTimerSettingChange('timeBasedScoring', e.target.checked)}
                disabled={!timerSettings.enabled}
              />
              <FormLabel htmlFor="time-based-scoring">Time-based scoring (faster = more points)</FormLabel>
            </FormCheckboxContainer>
          </FormGroup>
        </TimerSettingsContainer>
        
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
      </QuizContainer>
    );
  }
  
  return (
    <QuizContainer>
      <QuizHeader>
        <QuizTitle>{title}</QuizTitle>
        <QuizDescription>{description}</QuizDescription>
        
        {!quizCompleted && (
          <>
            <ProgressBar>
              <ProgressFill progress={progressPercentage} />
            </ProgressBar>
            <QuestionCounter>
              Question {currentQuestion + 1} of {questions.length}
            </QuestionCounter>
          </>
        )}
      </QuizHeader>
      
      {quizCompleted ? (
        <ResultsContainer>
          <ResultsTitle>Quiz Complete!</ResultsTitle>
          <ScoreMessage>Your score: {score}%</ScoreMessage>
          
          <ScoreDetails>
            <DetailRow>
              <span>Total Questions:</span>
              <span>{questions.length}</span>
            </DetailRow>
            <DetailRow>
              <span>Correct Answers:</span>
              <span>{totalCorrect}</span>
            </DetailRow>
            <DetailRow>
              <span>Incorrect Answers:</span>
              <span>{questions.length - totalCorrect}</span>
            </DetailRow>
            <DetailRow>
              <span>Final Score:</span>
              <span>{score}%</span>
            </DetailRow>
          </ScoreDetails>
          
          <NavigationButton onClick={handleRestart} isPrimary>
            Restart Quiz
          </NavigationButton>
          
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
                    .map((entry, index) => {
                      const isCurrentUser = entry.userId === user.id;
                      return (
                        <LeaderboardRow key={entry.userId}>
                          <LeaderboardCell highlight={isCurrentUser}>{index + 1}</LeaderboardCell>
                          <LeaderboardCell highlight={isCurrentUser}>
                            {entry.userName}{isCurrentUser ? ' (You)' : ''}
                          </LeaderboardCell>
                          <LeaderboardCell highlight={isCurrentUser}>{entry.score}%</LeaderboardCell>
                        </LeaderboardRow>
                      );
                    })}
                </LeaderboardBody>
              </LeaderboardTable>
            </>
          )}
        </ResultsContainer>
      ) : (
        <>
          {timerSettings.enabled && (
            <CountdownTimer
              duration={timerSettings.duration}
              isActive={!isAnswerRevealed}
              onComplete={handleTimerComplete}
              onTick={setQuestionTimeLeft}
              showProgress={true}
            />
          )}
          
          <QuestionContainer>
            <QuestionText>{currentQuestionData?.text}</QuestionText>
            
            <OptionsGrid>
              {currentQuestionData?.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                const isSelected = selectedAnswer === index;
                const isCorrect = index === correctAnswerIndex;
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
    </QuizContainer>
  );
};

export default Quiz;