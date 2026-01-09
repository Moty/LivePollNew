import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { io } from 'socket.io-client';

// Activity components
import Poll from '../../components/activities/Poll';
import Quiz from '../../components/activities/Quiz';
import WordCloud from '../../components/activities/WordCloud';
import QA from '../../components/activities/QA';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const checkmark = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: calc(100vh - 200px);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.3s ease-out;
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SessionInfo = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  p:first-child {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 4px;
  }
  p:last-child {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: 20px;
  font-size: 0.875rem;
  background-color: ${({ theme, type }) => {
    switch(type) {
      case 'success': return theme.colors.accent + '20';
      case 'warning': return '#FFA50020';
      case 'error': return theme.colors.error + '20';
      default: return theme.colors.background.secondary;
    }
  }};
  color: ${({ theme, type }) => {
    switch(type) {
      case 'success': return theme.colors.accent;
      case 'warning': return '#FFA500';
      case 'error': return theme.colors.error;
      default: return theme.colors.text.secondary;
    }
  }};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ActivityContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.3s ease-out;
`;

const WaitingScreen = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const WaitingAnimation = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  svg {
    width: 64px;
    height: 64px;
    color: ${({ theme }) => theme.colors.primary};
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: ${({ theme }) => theme.spacing.md};

  svg {
    animation: ${spin} 1s linear infinite;
    color: ${({ theme }) => theme.colors.primary};
    width: 48px;
    height: 48px;
  }

  p {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

// Join Screen Styles
const JoinScreen = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const JoinTitle = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const JoinSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SessionCodeDisplay = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primary}CC);
  color: white;
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  p {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }

  h2 {
    font-size: 2rem;
    letter-spacing: 4px;
    font-weight: 700;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const JoinButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}DD;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Error Screen Styles
const ErrorScreen = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const ErrorIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.error}20;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.error};

  svg {
    width: 40px;
    height: 40px;
  }
`;

const ErrorTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ErrorDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: left;

  h4 {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  ul {
    list-style: disc;
    padding-left: ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 0.875rem;

    li {
      margin-bottom: ${({ theme }) => theme.spacing.xs};
    }
  }
`;

const RetryButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: 1rem;
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}DD;
  }
`;

const HomeButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

// Toast Notification
const Toast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme, type }) =>
    type === 'success' ? theme.colors.accent :
    type === 'error' ? theme.colors.error :
    theme.colors.primary};
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${fadeIn} 0.3s ease-out;
  z-index: 1000;

  svg {
    width: 20px;
    height: 20px;
    ${({ type }) => type === 'success' && css`animation: ${checkmark} 0.3s ease-out;`}
  }
`;

const ParticipantView = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  // States
  const [phase, setPhase] = useState('join'); // 'join', 'connecting', 'connected', 'error'
  const [socket, setSocket] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('participantName') || '');
  const [userId] = useState(() => localStorage.getItem('participantId') || `user_${Math.random().toString(36).substring(2, 9)}`);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submittedActivities, setSubmittedActivities] = useState(new Set());

  // Save participant ID to localStorage
  useEffect(() => {
    localStorage.setItem('participantId', userId);
  }, [userId]);

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Connect to session
  const connectToSession = useCallback(() => {
    if (!userName.trim()) return;

    setPhase('connecting');
    localStorage.setItem('participantName', userName);

    const SOCKET_API_ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

    const newSocket = io(SOCKET_API_ENDPOINT, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000,
      query: {
        sessionCode: code,
        role: 'participant'
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      newSocket.emit('join-session', {
        sessionCode: code,
        userId: userId,
        userName: userName.trim(),
        role: 'participant'
      });
    });

    newSocket.on('session-info', (data) => {
      console.log('Received session-info:', data);
      setSessionData(data);
      setPhase('connected');
      showToast(`Joined "${data.title || 'session'}" successfully!`, 'success');

      // Check if there's an active activity
      if (data.activeActivity) {
        setActiveActivity(data.activeActivity);
      }
    });

    newSocket.on('session-error', (err) => {
      console.error('Session error:', err);
      setError({
        code: err.code || 'UNKNOWN',
        message: err.message || 'An error occurred'
      });
      setPhase('error');
      newSocket.disconnect();
    });

    // Handle activity events
    const activityEventHandler = (data) => {
      console.log('Received activity update:', data);
      const activity = data.activity || data;
      setActiveActivity(activity);
      // Clear submitted state for new activity
      if (activity && activity._id) {
        setSubmittedActivities(prev => {
          const newSet = new Set(prev);
          newSet.delete(activity._id);
          return newSet;
        });
      }
    };

    newSocket.on('activity-started', activityEventHandler);
    newSocket.on('activity-updated', activityEventHandler);
    newSocket.on('update-activity', activityEventHandler);
    newSocket.on('start-activity', activityEventHandler);

    newSocket.on('activity-ended', () => {
      setActiveActivity(null);
      showToast('Activity ended', 'info');
    });

    newSocket.on('session-ended', () => {
      setError({
        code: 'SESSION_ENDED',
        message: 'The session has ended'
      });
      setPhase('error');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError({
        code: 'CONNECTION_ERROR',
        message: 'Unable to connect to the session'
      });
      setPhase('error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        setError({
          code: 'DISCONNECTED',
          message: 'You were disconnected from the session'
        });
        setPhase('error');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [code, userId, userName, showToast]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Activity submission handlers with feedback
  const handlePollSubmit = (pollId, optionIndex) => {
    if (!socket || !sessionData) return;

    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: pollId,
      userId,
      userName,
      responseType: 'poll',
      responseData: { selectedOption: optionIndex }
    });

    setSubmittedActivities(prev => new Set(prev).add(pollId));
    showToast('Vote submitted!', 'success');
  };

  const handleQuizSubmit = (quizId, answers) => {
    if (!socket || !sessionData) return;

    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: quizId,
      userId,
      userName,
      responseType: 'quiz',
      responseData: { answers }
    });

    setSubmittedActivities(prev => new Set(prev).add(quizId));
    showToast('Quiz submitted!', 'success');
  };

  const handleWordCloudSubmit = (wordCloudId, word) => {
    if (!socket || !sessionData) return;

    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: wordCloudId,
      userId,
      userName,
      responseType: 'wordcloud',
      responseData: { word }
    });

    showToast(`"${word}" submitted!`, 'success');
  };

  const handleQASubmit = (qaId, question) => {
    if (!socket || !sessionData) return;

    const questionText = typeof question === 'object' ? question.text : question;

    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: qaId,
      userId,
      userName,
      responseType: 'qa',
      responseData: { question: questionText }
    });

    showToast('Question submitted!', 'success');
  };

  const handleQAUpvote = (qaId, questionId) => {
    if (!socket) return;
    socket.emit('question-upvote', {
      sessionId: sessionData?.sessionId,
      questionId,
      userId
    });
    showToast('Upvoted!', 'success');
  };

  // Render join screen
  if (phase === 'join') {
    return (
      <Container>
        <JoinScreen>
          <JoinTitle>Join Session</JoinTitle>
          <JoinSubtitle>Enter your name to participate</JoinSubtitle>

          <SessionCodeDisplay>
            <p>Session Code</p>
            <h2>{code}</h2>
          </SessionCodeDisplay>

          <FormGroup>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && connectToSession()}
              autoFocus
            />
          </FormGroup>

          <JoinButton
            onClick={connectToSession}
            disabled={!userName.trim()}
          >
            Join Session
          </JoinButton>
        </JoinScreen>
      </Container>
    );
  }

  // Render connecting screen
  if (phase === 'connecting') {
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
          <p>Connecting to session...</p>
        </LoadingSpinner>
      </Container>
    );
  }

  // Render error screen
  if (phase === 'error') {
    const getErrorDetails = () => {
      switch(error?.code) {
        case 'SESSION_NOT_FOUND':
          return {
            title: 'Session Not Found',
            suggestions: [
              'Check that the session code is correct',
              'The session may have ended',
              'Ask the presenter for the correct code'
            ]
          };
        case 'SESSION_ENDED':
          return {
            title: 'Session Ended',
            suggestions: [
              'The presenter has ended this session',
              'Contact the presenter if you need to rejoin',
              'Check if a new session has been started'
            ]
          };
        case 'CONNECTION_ERROR':
          return {
            title: 'Connection Failed',
            suggestions: [
              'Check your internet connection',
              'The server may be temporarily unavailable',
              'Try again in a few moments'
            ]
          };
        case 'RATE_LIMITED':
          return {
            title: 'Too Many Attempts',
            suggestions: [
              'You\'ve made too many connection attempts',
              'Please wait a minute before trying again'
            ]
          };
        default:
          return {
            title: 'Something Went Wrong',
            suggestions: [
              'Try refreshing the page',
              'Check your internet connection',
              'Contact the presenter for help'
            ]
          };
      }
    };

    const errorDetails = getErrorDetails();

    return (
      <Container>
        <ErrorScreen>
          <ErrorIcon>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </ErrorIcon>

          <ErrorTitle>{errorDetails.title}</ErrorTitle>
          <ErrorMessage>{error?.message}</ErrorMessage>

          <ErrorDetails>
            <h4>What you can try:</h4>
            <ul>
              {errorDetails.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </ErrorDetails>

          <div>
            <RetryButton onClick={() => {
              setError(null);
              setPhase('join');
            }}>
              Try Again
            </RetryButton>
            <HomeButton onClick={() => navigate('/')}>
              Go Home
            </HomeButton>
          </div>
        </ErrorScreen>
      </Container>
    );
  }

  // Render activity
  const renderActivity = () => {
    if (!activeActivity) {
      return (
        <WaitingScreen>
          <WaitingAnimation>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </WaitingAnimation>
          <h2>Waiting for the presenter</h2>
          <p>The next activity will appear here when it starts</p>
        </WaitingScreen>
      );
    }

    const activity = activeActivity.activity || activeActivity;

    // Normalize legacy payloads where fields live under config
    const activityId = activity?._id || activity?.activityId || activity?.id;
    const normalizedActivity = {
      ...activity,
      _id: activityId,
      options: activity?.options || activity?.config?.options || [],
      question: activity?.question || activity?.config?.question || activity?.title,
      questions: (() => {
        // If questions array already exists, use it
        if (activity?.questions?.length > 0) return activity.questions;
        if (activity?.config?.questions?.length > 0) return activity.config.questions;
        
        // For quiz activities: convert single question format to questions array
        const activityType = (activity?.type || activity?.activityType || '').toLowerCase();
        if (activityType === 'quiz') {
          const question = activity?.question || activity?.config?.question;
          const options = activity?.options || activity?.config?.options;
          const correctIndex = activity?.correctIndex ?? activity?.config?.correctIndex;
          
          // If we have a question and options, create a questions array
          if (question && options?.length > 0) {
            return [{
              text: question,
              options: options,
              correctAnswer: correctIndex ?? 0  // Note: Quiz component uses correctAnswer, not correctIndex
            }];
          }
        }
        
        return [];
      })(),
      type: activity?.type || activity?.activityType
    };

    const activityType = (normalizedActivity.type || '').toLowerCase();
    // If we still don't have a type, infer poll when options exist
    const resolvedType = activityType || (Array.isArray(normalizedActivity.options) ? 'poll' : '');

    if (!activity || !resolvedType) {
      return (
        <WaitingScreen>
          <h2>Loading activity...</h2>
        </WaitingScreen>
      );
    }

    const hasSubmitted = submittedActivities.has(activityId || activity._id);

    switch (resolvedType) {
      case 'poll':
        return (
          <Poll
            {...normalizedActivity}
            isPresenter={false}
            hasSubmitted={hasSubmitted}
            onSubmit={(optionIndex) => handlePollSubmit(activityId || activity._id, optionIndex)}
          />
        );
      case 'quiz':
        return (
          <Quiz
            {...normalizedActivity}
            isPresenter={false}
            hasSubmitted={hasSubmitted}
            onSubmit={(answers) => handleQuizSubmit(activityId || activity._id, answers)}
          />
        );
      case 'wordcloud':
        return (
          <WordCloud
            {...normalizedActivity}
            isPresenter={false}
            onSubmit={(id, word) => handleWordCloudSubmit(id || activityId || activity._id, word)}
          />
        );
      case 'qa':
        return (
          <QA
            {...normalizedActivity}
            isPresenter={false}
            onSubmit={(question) => handleQASubmit(activityId || activity._id, question)}
            onUpvote={(questionId) => handleQAUpvote(activityId || activity._id, questionId)}
          />
        );
      default:
        return (
          <WaitingScreen>
            <h2>Unsupported Activity</h2>
            <p>Activity type "{activity.type}" is not supported.</p>
          </WaitingScreen>
        );
    }
  };

  // Connected view
  return (
    <Container>
      <Header>
        <Title>{sessionData?.title || 'Interactive Session'}</Title>
        <Description>Welcome, {userName}!</Description>

        <StatusBar>
          <Status type="success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Connected
          </Status>

          <Status type={activeActivity ? 'success' : 'warning'}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {activeActivity ? 'Activity Active' : 'Waiting'}
          </Status>
        </StatusBar>
      </Header>

      <SessionInfo>
        <h2>Session Info</h2>
        <InfoGrid>
          <InfoItem>
            <p>Session Code</p>
            <p>{sessionData?.code || code}</p>
          </InfoItem>
          <InfoItem>
            <p>Participants</p>
            <p>{sessionData?.participantCount || 1}</p>
          </InfoItem>
          <InfoItem>
            <p>Joined</p>
            <p>{sessionData?.joinedAt ? new Date(sessionData.joinedAt).toLocaleTimeString() : 'Just now'}</p>
          </InfoItem>
        </InfoGrid>
      </SessionInfo>

      <ActivityContainer>
        {renderActivity()}
      </ActivityContainer>

      {toast && (
        <Toast type={toast.type}>
          {toast.type === 'success' && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {toast.message}
        </Toast>
      )}
    </Container>
  );
};

export default ParticipantView;
