import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { io } from 'socket.io-client';

// Activity components
import Poll from '../../components/activities/Poll';
import Quiz from '../../components/activities/Quiz';
import WordCloud from '../../components/activities/WordCloud';
import QA from '../../components/activities/QA';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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
  }
`;

const Status = styled.div`
  color: ${({ theme, active }) => active ? theme.colors.accent : theme.colors.text.secondary};
  font-weight: ${({ active }) => active ? '600' : '400'};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ActivityContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  
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

// TODO: Implement full ParticipantView component
const ParticipantView = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [userName, setUserName] = useState('Anonymous');
  const [userId, setUserId] = useState('');
  
  // TODO: Implement socket connection setup
  useEffect(() => {
    // Generate unique user ID if not already set
    if (!userId) {
      setUserId(`user_${Math.random().toString(36).substring(2, 9)}`);
    }
    
    console.log('Setting up socket connection for session code:', code);
    
    // Connect to Socket.IO server
    const SOCKET_API_ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    console.log('Connecting to socket at:', SOCKET_API_ENDPOINT);
    
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
      setConnected(true);
      
      // Join the presentation session using the code from URL
      console.log('Emitting join-session event with code:', code);
      newSocket.emit('join-session', { 
        sessionCode: code,
        userId: userId,
        userName: userName,
        role: 'participant'
      });
    });
    
    newSocket.on('session-info', (data) => {
      console.log('Received session-info:', data);
      setSessionData(data);
          setLoading(false);
    });
    
    // Handle different activity event types
    const activityEventHandler = (data) => {
      console.log('Received activity update:', data);
      setActiveActivity(data);
    };
    
    // Listen for multiple event types for backwards compatibility
    newSocket.on('activity-started', activityEventHandler);
    newSocket.on('activity-updated', activityEventHandler);
    newSocket.on('update-activity', activityEventHandler);
    newSocket.on('start-activity', activityEventHandler);
    
    newSocket.on('end-activity', () => {
      console.log('Activity ended');
      setActiveActivity(null);
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
      setConnected(false);
    });
    
    // Debug event logging in development
    if (process.env.NODE_ENV === 'development') {
      const originalOnevent = newSocket.onevent;
      newSocket.onevent = function(packet) {
        const event = packet.data[0];
        if (event !== 'ping' && event !== 'pong') {
          console.log(`[SOCKET EVENT] ${event}:`, packet.data.slice(1));
        }
        originalOnevent.call(this, packet);
      };
    }
    
    // Connect the socket
    console.log('Initiating socket connection...');
    newSocket.connect();
    
    setSocket(newSocket);
    
    return () => {
      // Clean up socket connection
      console.log('Cleaning up socket connection');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [code, userId, userName]);
  
  // TODO: Implement handlers for different activity interactions
  const handlePollSubmit = (pollId, optionIndex) => {
    if (!socket || !connected || !sessionData) return;
    
    console.log(`Submitting poll response: Poll ${pollId}, Option ${optionIndex}`);
    
    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: pollId,
      userId,
      userName,
      responseType: 'poll',
      response: { optionIndex }
    });
  };
  
  const handleQuizSubmit = (quizId, answers) => {
    if (!socket || !connected || !sessionData) return;
    
    console.log(`Submitting quiz response: Quiz ${quizId}, Answers:`, answers);
    
    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: quizId,
      userId,
      userName,
      responseType: 'quiz',
      response: { answers }
    });
  };
  
  const handleWordCloudSubmit = (wordCloudId, word) => {
    if (!socket || !connected || !sessionData) return;
    
    console.log(`Submitting word cloud response: WordCloud ${wordCloudId}, Word: ${word}`);
    
    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: wordCloudId,
      userId,
      userName,
      responseType: 'wordcloud',
      response: { word }
    });
  };
  
  const handleQASubmit = (qaId, question) => {
    if (!socket || !connected || !sessionData) return;
    
    // Handle both cases where question might be a string or an object with text property
    const questionText = typeof question === 'object' ? question.text : question;
    
    console.log(`Submitting question: QA ${qaId}, Question: ${questionText}`);
    
    socket.emit('activity-response', {
      sessionId: sessionData.sessionId,
      sessionCode: sessionData.code,
      activityId: qaId,
      userId,
      userName,
      responseType: 'qa',
      response: { question: questionText }
    });
  };
  
  const handleQAUpvote = (qaId, questionId) => {
    if (!socket || !connected) return;
    
    socket.emit('question-upvote', {
      sessionId: code,
      questionId,
      userId
    });
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
  
  if (!sessionData) {
    return (
      <Container>
        <SessionInfo>
          <h2>Session not found</h2>
          <p>The session code "{code}" doesn't exist or has ended.</p>
          <p>Please check the code and try again.</p>
        </SessionInfo>
      </Container>
    );
  }
  
  // TODO: Implement rendering active activity
  const renderActivity = () => {
    if (!activeActivity) {
      return (
        <WaitingScreen>
          <WaitingAnimation>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 21V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 7C15.7909 7 14 8.79086 14 11C14 13.2091 15.7909 15 18 15C20.2091 15 22 13.2091 22 11C22 8.79086 20.2091 7 18 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 17C3.79086 17 2 15.2091 2 13C2 10.7909 3.79086 9 6 9C8.20914 9 10 10.7909 10 13C10 15.2091 8.20914 17 6 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </WaitingAnimation>
          <h2>Waiting for presenter to start an activity</h2>
          <p>The presenter will start an activity shortly. Please wait...</p>
        </WaitingScreen>
      );
    }

    // Get activity object with proper properties
    const activity = activeActivity.activity || activeActivity;

    // Log the activity for debugging
    console.log('Rendering activity:', activity);

    // Ensure basic properties exist
    if (!activity || !activity.type) {
      console.error('Invalid activity object:', activity);
      return (
        <div>
          <h2>Error: Invalid activity data</h2>
          <p>The activity data is not properly formatted. Please try again later.</p>
        </div>
      );
    }

    // Handle different activity types
    switch (activity.type.toLowerCase()) {
      case 'poll':
        return (
          <Poll 
            {...activity}
            isPresenter={false}
            onSubmit={(optionIndex) => handlePollSubmit(activity._id, optionIndex)}
          />
        );
      case 'quiz':
        return (
          <Quiz 
            {...activity}
            isPresenter={false}
            onSubmit={(answers) => handleQuizSubmit(activity._id, answers)}
          />
        );
      case 'wordcloud':
        return (
          <WordCloud 
            {...activity}
            isPresenter={false}
            onSubmit={(word) => handleWordCloudSubmit(activity._id, word)}
          />
        );
      case 'qa':
        return (
          <QA 
            {...activity}
            isPresenter={false}
            onSubmit={(question) => handleQASubmit(activity._id, question)}
            onUpvote={(questionId) => handleQAUpvote(activity._id, questionId)}
          />
        );
      default:
        return (
          <div>
            <h2>Unsupported Activity Type</h2>
            <p>The activity type "{activity.type}" is not supported.</p>
          </div>
        );
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>{sessionData.title || 'Interactive Session'}</Title>
        <Description>{sessionData.description || 'Participate in interactive activities'}</Description>
        
        {!connected && (
          <Status active={false}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.05 3.05C4.05 4.05 2.05 9.05 2.05 12.05C2.05 15.05 3.05 19.05 7.05 20.95C11.05 22.85 14.05 19.95 15.05 18.95C16.05 17.95 17.05 16.05 17.05 14.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.05 10.05C13.8737 9.7292 13.6467 9.44349 13.38 9.2C12.9566 8.83146 12.4437 8.57921 11.8911 8.46264C11.3386 8.34606 10.765 8.36868 10.2243 8.52814C9.68357 8.6876 9.19581 8.97839 8.81001 9.37487C8.42421 9.77135 8.1509 10.261 8.01 10.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.07 4.93C19.9784 5.84209 20.7052 6.90158 21.212 8.059C21.7188 9.21641 21.997 10.4545 22.032 11.711C22.067 12.9676 21.8581 14.2185 21.4183 15.4021C20.9786 16.5856 20.3166 17.6783 19.472 18.622C18.6274 19.5656 17.6162 20.3436 16.4874 20.9116C15.3586 21.4797 14.1336 21.8266 12.879 21.9338C11.6245 22.041 10.3606 21.9063 9.15425 21.5383C7.94789 21.1703 6.82331 20.5763 5.85 19.79" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reconnecting...
          </Status>
        )}
        
        <Status active={true}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 11C9.10457 11 10 10.1046 10 9C10 7.89543 9.10457 7 8 7C6.89543 7 6 7.89543 6 9C6 10.1046 6.89543 11 8 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 18C17.1046 18 18 17.1046 18 16C18 14.8954 17.1046 14 16 14C14.8954 14 14 14.8954 14 16C14 17.1046 14.8954 18 16 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.67 5C20.5578 7.36024 22.0513 10.942 21.8086 14.6231C21.566 18.3043 19.618 21.6699 16.5261 23.6938" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.07 17C19.9047 15.3621 20.2719 13.5316 20.1337 11.7019C19.9954 9.87222 19.3568 8.11519 18.2891 6.61553C17.2214 5.11586 15.7647 3.93097 14.0827 3.18851C12.4007 2.44605 10.5535 2.17198 8.72996 2.39735C6.90641 2.62271 5.18351 3.33854 3.74731 4.47934C2.31111 5.62015 1.21627 7.14279 0.582579 8.86131C-0.0511111 10.5798 -0.196256 12.4265 0.160238 14.2052C0.516732 15.9839 1.36201 17.6301 2.6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 19C5.17733 18.1565 3.64928 16.7747 2.61283 15.0224C1.57638 13.2701 1.07185 11.2217 1.16828 9.15512C1.26471 7.08851 1.95814 5.10051 3.16693 3.45611C4.37573 1.81171 6.04788 0.584988 7.96421 0.0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Session Code: {sessionData.code || "..."}
        </Status>
        
        {activeActivity ? (
          <Status active={true}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5C4 4.46957 4.21071 3.96086 4.58579 3.58579C4.96086 3.21071 5.46957 3 6 3H14C14.5304 3 15.0391 3.21071 15.4142 3.58579C15.7893 3.96086 16 4.46957 16 5V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 21H6C5.46957 21 4.96086 20.7893 4.58579 20.4142C4.21071 20.0391 4 19.5304 4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 11V11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 15V15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.5 18.5L16.5 16.5L21 21L19 23L14.5 18.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 16L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.5 16.5L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity in progress
          </Status>
        ) : (
          <Status active={false}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.07183 19H19.0718C20.1637 19 20.8747 17.9399 20.3366 17L13.336 4C12.7979 3.06015 11.4857 3.06015 10.9475 4L3.94695 17C3.40882 17.9399 4.11977 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Waiting for activity to start
          </Status>
        )}
      </Header>
      
      <SessionInfo>
        <h2>Session Information</h2>
        <div>
          <p><strong>Participants:</strong> {sessionData.participantCount || 1}</p>
          <p><strong>Session ID:</strong> {sessionData.id || sessionData.sessionId}</p>
          <p><strong>Joined:</strong> {new Date(sessionData.joinedAt).toLocaleTimeString()}</p>
        </div>
      </SessionInfo>
      
      <ActivityContainer>
        {renderActivity()}
      </ActivityContainer>
    </Container>
  );
};

export default ParticipantView;
