import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';
import { Loader } from 'semantic-ui-react';
import { useAuth } from '../../contexts/AuthContext';

// Activity components
import Poll from '../../components/activities/Poll';
import Quiz from '../../components/activities/Quiz';
import WordCloud from '../../components/activities/WordCloud';
import QA from '../../components/activities/QA';
import ExportButton from '../../components/common/ExportButton';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-gap: ${({ theme }) => theme.spacing.lg};
  height: calc(100vh - 64px);
  overflow: hidden;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
`;

const Sidebar = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
`;

const SidebarSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
`;

const SessionCode = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
  
  svg {
    max-width: 100%;
  }
`;

const JoinUrl = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.sm};
  word-break: break-all;
  text-align: center;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ActivityItem = styled.button`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.background.primary};
  color: ${({ theme, $active }) => $active ? 'white' : theme.colors.text.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  text-align: left;
  cursor: pointer;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  
  &:hover {
    background-color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.background.tertiary};
  }
  
  svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
`;

const ActivityType = styled.div`
  font-size: 0.8rem;
  color: ${({ theme, $active }) => $active ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary};
`;

const MainContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  overflow-y: auto;
  height: calc(100vh - 64px);
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActivityTitle = styled.h2`
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme, $variant }) => 
    $variant === 'primary' ? theme.colors.primary : 
    $variant === 'danger' ? theme.colors.error :
    theme.colors.background.secondary};
  color: ${({ theme, $variant }) => 
    ($variant === 'primary' || $variant === 'danger') ? 'white' : theme.colors.text.primary};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme, $variant }) => 
      $variant === 'primary' ? `${theme.colors.primary}DD` : 
      $variant === 'danger' ? `${theme.colors.error}DD` :
      theme.colors.background.tertiary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatsPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatItem = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ResultsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const maxConnectionAttempts = 3; // Maximum connection attempts before forcing a cooldown

// Fullscreen Styles and X Icon
const FullscreenOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  z-index: 9999;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 100vw;
`;

const FullscreenContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
`;

const FullscreenExitButton = styled.button`
  position: absolute;
  top: 24px;
  right: 32px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(0,0,0,0.8);
  }
`;

// Floating QR/URL UI for Fullscreen
const FloatingQRContainer = styled.div`
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 10002;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 12px 16px 8px 16px;
  transition: opacity 0.2s;
`;

const FloatingQRHideButton = styled.button`
  margin-top: 4px;
  background: none;
  border: none;
  color: #444;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const FloatingQRShowButton = styled.button`
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 10002;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  font-size: 1.3rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

/**
 * PresentationView component for presenter mode
 * Allows control of activities and viewing live results
 */
const PresentationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [presentation, setPresentation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeActivity, setActiveActivity] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionCreationAttempted, setSessionCreationAttempted] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionErrorShown, setConnectionErrorShown] = useState(false);
  
  // Constants
  const SOCKET_API_ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
  
  // References to track component state and prevent loops
  const isMountedRef = useRef(true);
  const sessionCreatedRef = useRef(false);
  const lastConnectionAttemptRef = useRef(0);
  const connectionAttemptsRef = useRef(0);
  const socketRef = useRef(null);
  const backupSocketRef = useRef(null);
  const connectionLoopDetectorRef = useRef(null);
  const iframeRef = useRef(null);
  const modalRef = useRef();
  const activeActivityRef = useRef(null); // New ref for activeActivity
  
  // Track loading time for UX purposes
  const loadingStartTime = useRef(Date.now());
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Update loading time counter when in loading state
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setLoadingTime(Math.floor((Date.now() - loadingStartTime.current) / 1000));
      }, 1000);
    } else {
      // Reset timer when not in loading state
      setLoadingTime(0);
      loadingStartTime.current = Date.now();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);
  
  // Cleanup function that runs once on initial mount
  useEffect(() => {
    console.log('PresentationView component mounted at', new Date().toISOString());
    // Ensure mounted ref is set to true on component mount
    isMountedRef.current = true;
    
    // Clean up function (runs on unmount)
    return () => {
      console.log('PresentationView component UNMOUNTING at', new Date().toISOString());
      // Set mounted ref to false when component unmounts
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Debug useEffect for isMountedRef - remove this in production
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current === false) {
        console.warn('WARNING: isMountedRef is false while component is still rendering at', new Date().toISOString());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // UseCallbacks for event handlers and socket functions
  const logSocketEvent = useCallback((eventName, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Socket Event [${eventName}]:`, data);
    }
  }, []);
  
  // Add a retry mechanism with exponential backoff for WebSocket connection
  const setupSocketConnection = useCallback((sessionDataParam) => {
    try {
      console.log("Setting up socket connection...");
      console.log("Socket API endpoint:", SOCKET_API_ENDPOINT);
      
      // Calculate retry delay with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000); // Max 30 seconds
      
      // If we've recently tried to connect, wait before trying again
      const now = Date.now();
      const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
      if (timeSinceLastAttempt < retryDelay && connectionAttemptsRef.current > 0) {
        console.log(`Too soon to retry connection. Waiting ${(retryDelay - timeSinceLastAttempt)/1000}s before next attempt`);
        // Schedule retry after appropriate delay
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log(`Retrying connection after delay (attempt ${connectionAttemptsRef.current + 1})`);
            setupSocketConnection(sessionDataParam);
          }
        }, retryDelay - timeSinceLastAttempt);
        return null;
      }
      
      // Update connection attempt tracking
      connectionAttemptsRef.current += 1;
      lastConnectionAttemptRef.current = now;
      
      const newSocket = io(SOCKET_API_ENDPOINT, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: retryDelay,
        timeout: 10000,
        query: {
        presentationId: id,
          role: 'presenter',
          timestamp: Date.now() // Add timestamp to force a fresh connection
        }
      });
      
      // Store in ref for cleanup
      socketRef.current = newSocket;
      backupSocketRef.current = newSocket;
      setSocket(newSocket);
      
      // Set up event handlers
      newSocket.on("connect", () => {
        console.log("Socket connected with ID:", newSocket.id);
        setConnected(true);
        // Reset connection attempts on successful connection
        connectionAttemptsRef.current = 0;
        
        // If we have session data, sync it
        if (sessionDataParam) {
          console.log("Syncing existing session data:", sessionDataParam);
          newSocket.emit("join-session", {
            sessionId: sessionDataParam.sessionId,
            sessionCode: sessionDataParam.sessionCode,
            role: "presenter"
          });
        } else if (!sessionCreatedRef.current && !sessionReady) {
          // If no session data and no session created yet, create a new session
          console.log('Creating new session for presentation:', id);
          // Emit immediately to ensure we don't miss the connection window
          console.log('Immediately emitting create-session event with presentation ID:', id);
          newSocket.emit('create-session', {
            presentationId: id,
            presenterName: user?.name || 'Anonymous Presenter'
          });
          setSessionCreationAttempted(true);
        }
      });
      
      // Add error event handlers
      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnected(false);
        setConnectionError(`Connection error: ${err.message}`);
        
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000);
        console.log(`Will retry connection in ${retryDelay/1000}s due to error (attempt ${connectionAttemptsRef.current})`);
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected. Reason:', reason);
        setConnected(false);
        
        // Don't reset session if we already have one
        if (sessionCreatedRef.current || sessionReady) {
          console.log('Session already created, maintaining session state despite disconnect');
        }
      });
      
      // Add event for transport change to debug potential issues
      newSocket.io.on("upgrade", (transport) => {
        console.log(`Transport upgraded to ${transport.name}`);
      });
      
      newSocket.io.on("reconnect_attempt", (attempt) => {
        console.log(`Socket.IO reconnect attempt #${attempt}`);
      });
      
      // Session created event
      newSocket.on('session-created', (data) => {
        console.log("Session created:", data);
        
        // Handle different data formats
        const sessionId = data.sessionId || data.id;
        const sessionCode = data.sessionCode || data.code;
        
        if (!sessionId || !sessionCode) {
          console.error("Invalid session data received:", data);
      return;
    }
    
        console.log(`Session successfully created with ID: ${sessionId} and code: ${sessionCode}`);
        
        // Update state
        setSessionId(sessionId);
        setSessionCode(sessionCode);
        setSessionReady(true);
        setSessionData(data);
        sessionCreatedRef.current = true;
        setSessionCreationAttempted(true);
        
        // Log success
        success(`Session created with code: ${sessionCode}`);
      });
      
      // Session info handler
      newSocket.on("session-info", (data) => {
        console.log("Session info received:", data);
        setSessionId(data.sessionId || data.id);
        setSessionCode(data.code || data.sessionCode);
        setSessionData(data);
        setSessionReady(true);
        sessionCreatedRef.current = true;
      });
      
      // Add handler for activity responses
      newSocket.on('response-received', (data) => {
        console.log('Received response:', data);
        
        // Increment response count
        setResponseCount(prevCount => prevCount + 1);
        
        // Only process responses for the active activity
        if (activeActivityRef.current && data.activityId === activeActivityRef.current._id) {
          console.log('Updating active activity with new response');
          
          // Create a copy of the active activity
          const updatedActivity = { ...activeActivityRef.current };
          
          // Initialize responses array if it doesn't exist
          if (!updatedActivity.responses) {
            updatedActivity.responses = [];
          }
          
          // Add the response based on activity type
          switch (activeActivityRef.current.type) {
            case 'poll':
              // For polls, increment the vote for the selected option
              if (typeof data.response === 'number') {
                // If the response is just an option index
                if (!updatedActivity.responses[data.response]) {
                  updatedActivity.responses[data.response] = 1;
                } else {
                  updatedActivity.responses[data.response]++;
                }
              } else if (data.response && typeof data.response.optionIndex === 'number') {
                // If the response contains an optionIndex property
                const optionIndex = data.response.optionIndex;
                if (!updatedActivity.responses[optionIndex]) {
                  updatedActivity.responses[optionIndex] = 1;
                } else {
                  updatedActivity.responses[optionIndex]++;
                }
              }
              break;
              
            case 'wordcloud':
              // For word clouds, add the word to the responses array
              if (data.response && data.response.word) {
                updatedActivity.responses.push(data.response.word);
              }
              break;
              
            case 'qa':
              // For Q&A, add the question to the responses array
              if (data.response && data.response.question) {
                updatedActivity.responses.push({
                  id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  text: data.response.question,
                  author: data.participantName || 'Anonymous',
                  authorId: data.participantId || 'unknown',
                  timestamp: new Date().toISOString(),
                  votes: 0,
                  isApproved: true,
                  isHighlighted: false,
                  voters: []
                });
              }
              break;
              
            case 'quiz':
              // For quizzes, add the answers to the responses array
              if (data.response && data.response.answers) {
                updatedActivity.responses.push({
                  userId: data.participantId,
                  userName: data.participantName,
                  answers: data.response.answers,
                  timestamp: new Date().toISOString()
                });
              }
              break;
            
            default:
              // For unknown activity types, just push the raw response
              updatedActivity.responses.push(data.response);
          }
          
          // Update the active activity
          setActiveActivity(updatedActivity);
        }
      });
      
      // Handle activity results updates
      newSocket.on('activity-results-update', (data) => {
        console.log('Received activity results update:', data);
        // If activityId is present, match it; otherwise, assume it's for the current activity
        if (
          (data.activityId && activeActivityRef.current && data.activityId === activeActivityRef.current._id) ||
          (!data.activityId && activeActivityRef.current)
        ) {
          console.log('Updating active activity with new results (no activityId check needed)');
          if (data.totalResponses !== undefined) {
            setResponseCount(data.totalResponses);
          }
          // Update all relevant fields for all activity types
          setActiveActivity(prevActivity => ({
            ...prevActivity,
            // For polls/quizzes/wordcloud/qa, update all possible fields from the payload
            ...(data.responses ? { responses: data.responses } : {}),
            ...(data.options ? { options: data.options } : {}),
            ...(data.questions ? { questions: data.questions } : {}),
            ...(data.title ? { title: data.title } : {}),
            ...(data.description ? { description: data.description } : {}),
            ...(data.question ? { question: data.question } : {}),
            ...(data.activityType ? { type: data.activityType } : {}),
            ...(data.extra ? data.extra : {})
          }));
        }
      });
      
      // Handle participant join/leave events for real-time participant count
      newSocket.on('participant-joined', (data) => {
        console.log('Participant joined:', data);
        // The backend should send the updated participant count
        if (data.participantCount !== undefined) {
          setParticipantCount(data.participantCount);
        } else {
          // Fallback: increment by 1 if count not provided
          setParticipantCount((prev) => prev + 1);
        }
      });
      newSocket.on('participant-left', (data) => {
        console.log('Participant left:', data);
        if (data.participantCount !== undefined) {
          setParticipantCount(data.participantCount);
        } else {
          // Fallback: decrement by 1 if count not provided
          setParticipantCount((prev) => Math.max(prev - 1, 0));
        }
      });
      // Optionally, handle a full participant list/count update event
      newSocket.on('participants-update', (data) => {
        console.log('Participants update:', data);
        if (data.participantCount !== undefined) {
          setParticipantCount(data.participantCount);
        } else if (Array.isArray(data.participants)) {
          setParticipantCount(data.participants.length);
        }
      });
      
      // Connect the socket
      console.log("Initiating socket connection to:", SOCKET_API_ENDPOINT);
      console.log("Connection parameters:", {
        presentationId: id,
        role: 'presenter'
      });

      // Add lifecycle event listeners for debugging
      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      newSocket.on('reconnect', (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
        // Reset connection attempt counter on successful reconnection
        connectionAttemptsRef.current = 0;
      });

      newSocket.on('reconnect_error', (err) => {
        console.error('Socket reconnect error:', err);
      });

      // Listen for any events (in development)
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

      newSocket.connect();
      
      return newSocket;
    } catch (err) {
      console.error("Error setting up socket connection:", err);
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000);
      console.log(`Will retry connection in ${retryDelay/1000}s due to error (attempt ${connectionAttemptsRef.current})`);
      setTimeout(() => {
        if (isMountedRef.current) {
          setupSocketConnection(sessionDataParam);
        }
      }, retryDelay);
      return null;
    }
  }, [id, user, setConnected, setSessionReady, setSessionId, setSessionCode, setSessionData, setSessionCreationAttempted, setConnectionError, success, SOCKET_API_ENDPOINT, activeActivity, setResponseCount]);

  // Function to force persistent connection
  const forcePersistentConnection = useCallback(() => {
    // Only attempt reconnection if we have session data
    if (!sessionData) {
      console.log("No session data available, skipping connection check");
      return;
    }

    console.log("Force persistent connection check...");
    
    // If socket is disconnected or null, attempt to reconnect
    if (!socketRef.current || !socketRef.current.connected) {
      console.log("Socket disconnected, attempting to reconnect...");
      
      // Try to use backup socket if available
      if (backupSocketRef.current && backupSocketRef.current.connected) {
        console.log("Using backup socket reference");
        socketRef.current = backupSocketRef.current;
        setSocket(backupSocketRef.current);
        } else {
        // Create new connection if needed
        console.log("Creating new socket connection");
        setupSocketConnection(sessionData);
      }
      
      // Clear any connection errors since we have session data
      setConnectionErrorShown(false);
      setConnectionError(null);
    }
  }, [sessionData, setupSocketConnection, setConnectionError, setConnectionErrorShown]);

  // Set up socket connection on component mount
  useEffect(() => {
    // Initialize mount ref
    isMountedRef.current = true;
    
    console.log("Setting up initial socket connection for presentation:", id);
    
    // Only attempt to connect if we have an ID
    if (!id) {
      console.error("Cannot connect socket - missing presentation ID");
      return;
    }
    
    // Set up socket connection
    const socket = setupSocketConnection();
    
    // Create session if socket connected successfully
    if (socket) {
      console.log("Socket created, waiting for connection to create session");
      
      // Add a connection status check
      const checkConnection = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(checkConnection);
          return;
        }
        
        if (socket.connected && !sessionCreatedRef.current) {
          console.log("Socket connected, ensuring session creation");
          socket.emit('create-session', {
              presentationId: id,
            presenterName: user?.name || 'Anonymous Presenter'
          });
          setSessionCreationAttempted(true);
        }
      }, 2000); // Check every 2 seconds
      
      // Clear interval after 20 seconds to prevent memory leaks
      setTimeout(() => {
        clearInterval(checkConnection);
        
        // If no session created after 20 seconds, show message
        if (isMountedRef.current && !sessionCreatedRef.current) {
          console.log("Session creation timed out - consider using Force Continue");
          setErrorDetails("Session creation timed out. You can use the Force Continue button to proceed with limited functionality.");
        }
      }, 20000);
      
      // Keep track of interval for cleanup
      const intervalRef = checkConnection;
      
      // Cleanup function
      return () => {
        console.log('PresentationView unmounting, cleaning up socket connection');
        isMountedRef.current = false;
        clearInterval(intervalRef);
        
        if (socket) {
          console.log('Disconnecting socket');
          socket.disconnect();
        }
      };
    }
    
      return () => {
      isMountedRef.current = false;
    };
  }, [setupSocketConnection, id, user?.name, setErrorDetails]);

  // Effect for periodic connection check
  useEffect(() => {
    if (!forcePersistentConnection) return;
    console.log("Setting up persistent connection check");
    
    // Set up periodic check only if we have forcePersistentConnection defined
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        forcePersistentConnection();
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      // Clean up interval on unmount
      clearInterval(interval);
    };
  }, [forcePersistentConnection, isMountedRef]);

  // Real-time WordCloud/Activity Response Update
  useEffect(() => {
    if (!socket || !activeActivity) return;

    // Handler for activity updates (new responses)
    const handleActivityUpdate = (data) => {
      console.log('[SOCKET EVENT PAYLOAD]', data); // <--- LOGGING ADDED
      // Accept update if for current activity
      if (data.activity && data.activity._id === activeActivity._id) {
        setActiveActivity(prev => ({
          ...prev,
          ...data.activity, // in case other properties change
          responses: data.activity.responses || []
        }));
      } else if (data.activityId === activeActivity._id && data.responses) {
        setActiveActivity(prev => ({
          ...prev,
          responses: data.responses
        }));
      }
    };

    // Listen for all possible update events
    socket.on('activity-updated', handleActivityUpdate);
    socket.on('update-activity', handleActivityUpdate);
    socket.on('activity-results-update', handleActivityUpdate);

    // Clean up
    return () => {
      socket.off('activity-updated', handleActivityUpdate);
      socket.off('update-activity', handleActivityUpdate);
      socket.off('activity-results-update', handleActivityUpdate);
    };
  }, [socket, activeActivity]);

  // Update the ref with latest activeActivity on every render
  useEffect(() => {
    activeActivityRef.current = activeActivity;
  }, [activeActivity]);

  // Fetch presentation data
  const fetchPresentationData = async () => {
    console.log(`Attempting to fetch presentation ${id} at ${new Date().toISOString()}`);
    
    // Set loading state first - outside the try block
    setLoading(true);
    setErrorDetails(null);

    try {
      if (!isMountedRef.current) {
        console.log('Component not mounted, skipping fetch attempt');
        return;
      }
      
      // Check if backend is likely running by doing a simple fetch to /api/health
      let backendHealthy = false;
    try {
      const backendUrlBase = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      // Remove '/api' from the end of the base URL if it exists to avoid duplicating it
      const baseUrl = backendUrlBase.endsWith('/api') 
        ? backendUrlBase 
        : `${backendUrlBase}/api`;
      
      console.log(`Checking backend health at ${baseUrl}/health`);
        const healthResponse = await fetch(`${baseUrl}/health`);
      
      if (!healthResponse.ok) {
        console.error('Backend health check failed, status:', healthResponse.status);
        } else {
      const healthData = await healthResponse.json();
      console.log('Backend health check passed:', healthData);
          backendHealthy = true;
        }
    } catch (healthError) {
      console.error('Backend connection error:', healthError.message);
      }
      
      // Validate presentation ID
      if (!id) {
        console.error('Missing presentation ID in fetchPresentationData');
        throw new Error('Invalid presentation ID');
      }
      
      let presentationData = null;
      
      // Try the API call if the backend appears healthy
      if (backendHealthy) {
        console.log(`Fetching presentation data for ID: ${id} at ${new Date().toISOString()}`);
        
        try {
          // Try to load from API with a timeout to prevent hanging
          console.log(`Attempting API fetch for presentation ${id}`);
          const fetchPromise = apiService.getPresentation(id)
            .then(response => {
              console.log(`API fetch completed successfully at ${new Date().toISOString()}`);
              return response;
            })
            .catch(error => {
              console.error(`API fetch failed at ${new Date().toISOString()}:`, error);
              throw error;
            });
            
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
              console.log(`API timeout triggered at ${new Date().toISOString()}`);
              reject(new Error('API request timeout'));
            }, 5000)
          );
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          console.log('Received presentation data:', response);
          
          if (!response || !response.data) {
            console.error('Invalid presentation data structure:', response);
            throw new Error('Invalid presentation data received');
          }
          
          // Ensure activities array exists and has the correct structure
          presentationData = {
            ...response.data,
            activities: response.data.activities?.map(activity => ({
                ...activity,
              _id: activity._id || activity.id || `mock_${Math.random().toString(36).substr(2, 9)}`,
              type: activity.type?.toLowerCase() || 'unknown',
                title: activity.title || activity.question || 'Untitled Activity',
                responses: activity.responses || []
            })) || []
          };
          
          console.log('Processed presentation data:', presentationData);
        } catch (apiError) {
          console.error('API error:', apiError);
          console.error('API error details:', apiError.message);
          // Instead of falling back to mock data, we'll throw the error to be handled in the catch block
          throw apiError;
        }
      } else {
        // If backend is not healthy, throw error instead of using mock data
        throw new Error('Backend connection failed. Please check your network connection and try again.');
      }
      
      // Final check to make sure the component is still mounted before updating state
      if (isMountedRef.current) {
        console.log('Setting presentation data in state at', new Date().toISOString());
        setPresentation(presentationData);
        setActivities(presentationData.activities || []);
      setLoading(false);
      } else {
        console.log('Component not mounted, skipping state update');
      }
    } catch (err) {
      console.error('Error in fetchPresentationData:', err);
      
      if (isMountedRef.current) {
        // Instead of using mock data, just show the error
        setErrorDetails(err.message || 'Failed to load presentation data. Please try again later.');
        setLoading(false);
      }
    }
  };
  
  // Effect to fetch the presentation data when the component mounts or when the ID changes
  useEffect(() => {
    // Clean up invalid session codes in localStorage
    if (id) {
      localStorage.removeItem(`session_code_${id}`);
    }
    
    console.log(`Initiating presentation data fetch for ID: ${id}`);
    fetchPresentationData();
    
    // IMPORTANT: We're removing the automatic fallback to mock data
    // and only keeping a timeout to exit the loading state if stuck
    const safetyTimeout = setTimeout(() => {
      if (loading && isMountedRef.current) {
        console.log('SAFETY TIMEOUT: Force exit loading state, but not switching to mock data');
        setLoading(false);
        setErrorDetails('Loading timed out. Please try refreshing the page or check your connection.');
      }
    }, 15000); // 15 second timeout
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [id]); // Only re-run if ID changes
  
  // Modified socket connection options to prevent namespace disconnect issues
  const getSocketOptions = useCallback((presentationId) => {
    return {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increased timeout
      autoConnect: false,
      forceNew: true, // Try forcing new connection to prevent namespace issues
      transports: ['websocket'],
      query: {
        presentationId,
        role: 'presenter',
        timestamp: Date.now() // Add timestamp to ensure unique connections
      },
      auth: {
        token: localStorage.getItem('token') || 'dev-token'
      }
    };
  }, []);
  
  // Update the handleActivateActivity function
  const handleActivateActivity = useCallback((activity) => {
    if (!connected) {
      showError('Not connected to server. Please try reconnecting.');
      return;
    }
    
    if (!socket) {
      console.error('Socket not available');
      showError('Connection not ready. Please try again.');
      return;
    }
    
    if (!sessionReady) {
      console.error('Session not fully initialized', { sessionId, sessionCode });
      showError('Session initialization in progress. Please try again in a moment.');
      
      // Try to initialize the session if the socket is connected but session isn't ready
      if (connected && !sessionCreationAttempted) {
        console.log('Creating new session for presentation:', id);
        socket.emit('create-session', { presentationId: id });
        setSessionCreationAttempted(true);
      }
      return;
    }
    
    console.log(`Activating activity in session ${sessionId}:`, activity);
    
    // Set active activity immediately for better UX
    setActiveActivity(activity);
    
    // Remove any existing event listeners to prevent duplicates
    socket.off('activity-update-confirmed');
    socket.off('session-error');
    
    // Emit event to update activity for participants
    socket.emit('update-activity', {
      sessionId,
      activity: {
        ...activity,
        startedAt: new Date().toISOString()
      }
    });
    
    // Handle activity update confirmation
    socket.once('activity-update-confirmed', (data) => {
      console.log('Activity update confirmed:', data);
      success(`Activated: ${activity.title || activity.question}`);
    });
    
    // Handle activity update error
    socket.once('session-error', (error) => {
      console.error('Error activating activity:', error);
      showError(`Failed to activate activity: ${error.message}`);
    });
  }, [connected, socket, sessionId, sessionCode, sessionReady, sessionCreationAttempted, id, success, showError]);

  // End current activity
  const handleEndActivity = useCallback(() => {
    if (!activeActivity) return;
    
    if (socket && connected && sessionReady && sessionId) {
      console.log(`Ending activity ${activeActivity._id} in session ${sessionId}`);
      socket.emit('end-activity', {
        sessionId,
        activityId: activeActivity._id
      });
      } else {
      console.log('Activity ended locally only (offline mode)');
    }
    
    setActiveActivity(null);
    success('Activity ended');
  }, [activeActivity, socket, connected, sessionReady, sessionId, success]);

  // End the entire session
  const handleEndSession = useCallback(() => {
    if (socket && connected && sessionReady && sessionId) {
      console.log(`Ending session ${sessionId}`);
      socket.emit('end-session', { sessionId });
    } else {
      console.log('Session ended locally only (offline mode)');
    }
    
    // Clear local storage session code
    if (id) {
      localStorage.removeItem(`session_code_${id}`);
    }
    
    navigate(`/dashboard`);
    success('Session ended');
  }, [socket, connected, sessionReady, sessionId, id, navigate, success]);
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'poll':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 14H7V19H9V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 10H11V19H13V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 6H15V19H17V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'quiz':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11C19.7554 11 19.5216 10.8946 19.3536 10.7071C19.1855 10.5196 19.08 10.2652 19.08 10C19.08 9.73478 19.1855 9.48043 19.3536 9.29289C19.5216 9.10536 19.7554 9 20 9C20.2446 9 20.4784 9.10536 20.6464 9.29289C20.8145 9.48043 20.92 9.73478 20.92 10C20.92 10.2652 20.8145 10.5196 20.6464 10.7071C20.4784 10.8946 20.2446 11 20 11Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 6C19.7554 6 19.5216 5.89464 19.3536 5.70711C19.1855 5.51957 19.08 5.26522 19.08 5C19.08 4.73478 19.1855 4.48043 19.3536 4.29289C19.5216 4.10536 19.7554 4 20 4C20.2446 4 20.4784 4.10536 20.6464 4.29289C20.8145 4.48043 20.92 4.73478 20.92 5C20.92 5.26522 20.8145 5.51957 20.6464 5.70711C20.4784 5.89464 20.2446 6 20 6Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 16C19.7554 16 19.5216 15.8946 19.3536 15.7071C19.1855 15.5196 19.08 15.2652 19.08 15C19.08 14.7348 19.1855 14.4804 19.3536 14.2929C19.5216 14.1054 19.7554 14 20 14C20.2446 14 20.4784 14.1054 20.6464 14.2929C20.8145 14.4804 20.92 14.7348 20.92 15C20.92 15.2652 20.8145 15.5196 20.6464 15.7071C20.4784 15.8946 20.2446 16 20 16Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 5H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'wordcloud':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 7L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 7L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 12L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 17L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 17L20 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'qa':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16.5V16.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 13.5C11.9816 13.1754 12.0692 12.8536 12.2495 12.5828C12.4299 12.312 12.6933 12.1091 13 12C13.3759 11.8563 13.7132 11.6247 13.9851 11.3276C14.2571 11.0304 14.4567 10.6753 14.5693 10.2907C14.6819 9.90603 14.7043 9.50147 14.6347 9.10632C14.5651 8.71116 14.4057 8.33827 14.1695 8.01531C13.9333 7.69235 13.6271 7.42876 13.2745 7.24588C12.9218 7.063 12.5326 6.96744 12.1379 6.96717C11.7431 6.96691 11.3538 7.06194 11.001 7.24435C10.6482 7.42676 10.3417 7.68993 10.105 8.0125" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };
  
  // Render the active activity results
  const renderActivityResults = () => {
    if (!activeActivity) return null;
    
    // Ensure activity has proper structure for rendering
    const safeActivity = {
      ...activeActivity,
      options: activeActivity.options || [],
      responses: activeActivity.responses || [],
      questions: activeActivity.questions || [],
      // Ensure other required properties based on activity type
      ...(activeActivity.type === 'poll' && !activeActivity.options ? { options: ["No options available"] } : {}),
      ...(activeActivity.type === 'quiz' && !activeActivity.questions ? { questions: [] } : {}),
      ...(activeActivity.type === 'wordcloud' && !activeActivity.question ? { question: "No question available" } : {})
    };
    
    try {
      switch (activeActivity.type) {
      case 'poll':
          return <Poll 
            isPresenter={true} 
            id={safeActivity._id}
            {...activeActivity}
            question={safeActivity.question || safeActivity.title || "Poll Question"}
            options={safeActivity.options}
            results={safeActivity.responses?.map((response, index) => ({
              option: safeActivity.options[index] || `Option ${index+1}`,
              votes: Array.isArray(response) ? response.length : (typeof response === 'number' ? response : 0)
            }))}
            showResults={true}
            mode="present"
          />;
      case 'quiz':
          return <Quiz 
            isPresenter={true}
            id={safeActivity._id}
            title={safeActivity.title || "Quiz"} 
            questions={safeActivity.questions}
            responses={safeActivity.responses || []}
            showResults={true}
            mode="present"
          />;
      case 'wordcloud':
        // Process word cloud data - count word frequencies
        const wordFrequency = {};
        safeActivity.responses?.forEach(resp => {
          // Handle both string responses and object responses with 'word' property
          const word = typeof resp === 'string' ? resp : (resp?.word || '');
          if (word && typeof word === 'string') {
            const cleanWord = word.trim().toLowerCase();
            if (cleanWord) {
              wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
            }
          }
        });
        const formattedWords = Object.keys(wordFrequency).map(word => ({
          text: word,
          value: wordFrequency[word]
        }));
        return <WordCloud 
          isPresenter={true}
          id={safeActivity._id}
          title={safeActivity.title || "Word Cloud"}
          description={safeActivity.description || safeActivity.question || "Submit words that come to mind"}
          words={formattedWords}
          mode="present"
        />;
      case 'qa':
          return <QA 
            isPresenter={true}
            id={safeActivity._id}
            title={safeActivity.title || "Q&A"}
            questions={safeActivity.responses?.map(q => (
              typeof q === 'object' ? q : { text: String(q), votes: 0, id: Math.random().toString() }
            )) || []}
            mode="present"
          />;
      default:
          console.warn(`Unknown activity type: ${activeActivity.type}`);
        return (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3>Unsupported Activity Type</h3>
              <p>The activity type "{activeActivity.type}" is not supported.</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering activity:', error);
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          color: '#d32f2f'
        }}>
          <h3>Error Rendering Activity</h3>
          <p>{error.message}</p>
          <p>Please try a different activity or refresh the page.</p>
          </div>
        );
    }
  };
  
  // Function to detect and handle connection loops
  const detectConnectionLoop = () => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
    
    if (timeSinceLastAttempt < 3000 && connectionAttemptsRef.current > maxConnectionAttempts) {
      console.error('Connection loop detected! Forcing cooldown.');
      // Force a cooldown period
      lastConnectionAttemptRef.current = now;
      connectionAttemptsRef.current = 0;
      
      // Add delay before trying again
      connectionLoopDetectorRef.current = setTimeout(() => {
        if (isMountedRef.current && !sessionCreatedRef.current) {
          console.log('Attempting connection after cooldown');
          
          // Use socket.connect() directly instead of setupSocketConnection
          if (socketRef.current) {
            console.log('Reconnecting existing socket');
            socketRef.current.connect();
          } else if (socket) {
            console.log('Using main socket reference');
            socket.connect();
          } else {
            console.log('No socket available for reconnection');
          }
        }
      }, 10000);
      
      return true; // Loop detected
    }
    
    // Set up loop detection for next cycle
    connectionLoopDetectorRef.current = setTimeout(detectConnectionLoop, 5000);
    return false; // No loop detected
  };
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mainContentRef = useRef(null);

  // Fullscreen API handlers
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) document.exitFullscreen();
      }
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Enter/exit fullscreen when state changes
  useEffect(() => {
    if (isFullscreen && mainContentRef.current) {
      if (mainContentRef.current.requestFullscreen) {
        mainContentRef.current.requestFullscreen();
      }
    } else if (!isFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  // Fullscreen QR/URL state
  const [showFloatingQR, setShowFloatingQR] = useState(true);

  // Render session initialization UI with options to retry or bypass
  const renderSessionInitializationUI = () => (
    <div className="session-initializing" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
        }}>
          <div style={{ marginBottom: '1rem' }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem auto'
        }}></div>
        <h3>Session initialization in progress...</h3>
        <p>This may take a few moments.</p>
        {errorDetails && (
          <div style={{ color: 'red', margin: '1rem 0' }}>
            <p>Error: {errorDetails}</p>
          </div>
        )}
        </div>
  
        <div style={{
          display: 'flex',
          flexDirection: 'column',
        gap: '0.5rem',
              width: '100%',
        maxWidth: '300px'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => {
              if (!isMountedRef.current) return;
            
              console.log('Retry button clicked in sidebar, resetting session state');
              
              // Reset all session state
              setSessionId(null);
              setSessionCode(null);
              setSessionReady(false);
              setSessionCreationAttempted(false);
              setErrorDetails(null);
              sessionCreatedRef.current = false;
              
              // Clear stored session data
              localStorage.removeItem(`session_code_${id}`);
              localStorage.removeItem(`session_id_${id}`);
              
              // Delay before trying again to ensure cleanup is complete
              setTimeout(() => {
                if (isMountedRef.current && socket) {
                  console.log('Attempting to reconnect after reset');
                  
                  // Close any existing connection
                  if (socket.connected) {
                    socket.disconnect();
                  }
                  
                  // Connect again after a short delay
                  setTimeout(() => {
                    if (isMountedRef.current && socket) {
                      socket.connect();
                    }
                  }, 500);
                }
              }, 1000);
            }}
            style={{
              flex: 1,
              padding: '0.25rem 0.5rem',
              backgroundColor: 'white',
              color: '#3498db',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            Retry
          </button>
          
            <button 
            onClick={() => {
              if (!isMountedRef.current) return;
              
              console.log('Force continue button clicked in sidebar - will attempt to create real session');
              
              // Instead of generating mock data, try to reconnect the socket
              if (socket && !socket.connected) {
                socket.connect();
                console.log('Attempting to reconnect socket...');
              }
              
              // Try to create a real session
              if (socket && socket.connected) {
                console.log('Socket connected, trying to create real session');
                socket.emit('create-session', {
                  presentationId: id,
                  presenterName: user?.name || 'Anonymous Presenter'
                });
                setSessionCreationAttempted(true);
              } else {
                console.log('Socket not connected, cannot create session');
                setErrorDetails('Socket not connected. Please try again or refresh the page.');
              }
            }}
              style={{
              flex: 1,
              padding: '0.25rem 0.5rem',
              backgroundColor: 'white',
              color: '#e67e22',
                border: 'none',
                borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem'
              }}
            >
            Force Continue
            </button>
        </div>
      </div>
    </div>
  );
            
  // Render loading state with more immediate feedback and escape option
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px'
      }}>
        <div style={{
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        
        <h2>Loading presentation data...</h2>
        <p>Time elapsed: {loadingTime} seconds</p>
        
        {loadingTime >= 5 && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <p>This is taking longer than expected. Please wait or try again later.</p>
          </div>
        )}
      </div>
    );
  }
  
  // Render error state
  if (errorDetails && !sessionReady) {
    return renderSessionInitializationUI();
  }
  
  if (!sessionReady && sessionCreationAttempted) {
    return renderSessionInitializationUI();
  }
  
  const joinUrl = `${window.location.origin}/join/${sessionCode}`;
  
  // Rest of the component remains unchanged
    return (
    <Container>
      <Sidebar style={{ display: isFullscreen ? 'none' : undefined }}>
        <SidebarSection>
          <SectionTitle>Session</SectionTitle>
          <SessionInfo>
            <SessionCode>{sessionCode || '...'}</SessionCode>
            
            <QRCodeContainer>
              {sessionCode && (
                <QRCode value={joinUrl} size={120} />
              )}
              <JoinUrl>{joinUrl}</JoinUrl>
            </QRCodeContainer>
            
            <Button
              $variant="danger"
              onClick={handleEndSession}
              disabled={!sessionReady || (!connected && connectionAttempts < 5)}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              End Session
            </Button>
            
            {!sessionReady && connected && (
      <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                Session initialization in progress...
              </div>
            )}
            
            {!connected && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: connectionAttempts >= 5 ? '#f39c12' : '#e74c3c',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                {reconnecting ? "Reconnecting..." : 
                  connectionAttempts >= 5 ? 
                  "Connection issue. Some features may be limited." : 
                  "Not connected to server. Retrying..."}
              </div>
            )}
          </SessionInfo>
        </SidebarSection>
        
        <SidebarSection>
          <SectionTitle>Activities</SectionTitle>
          
          {/* Activity list connection status */}
          {!connected || !sessionReady ? (
            <div style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: !connected ? '#e74c3c' : '#3498db',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.8rem',
              textAlign: 'center'
            }}>
              {!connected ? "Not connected to server" : "Session initialization in progress"}
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Activities will be available once the session is ready
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          onClick={() => {
                    if (!isMountedRef.current) return;
              
                    console.log('Retry button clicked in sidebar, resetting session state');
                    
                    // Reset all session state
                    setSessionId(null);
                    setSessionCode(null);
                    setSessionReady(false);
                    setSessionCreationAttempted(false);
                    setErrorDetails(null);
                    sessionCreatedRef.current = false;
                    
                    // Clear stored session data
                    localStorage.removeItem(`session_code_${id}`);
                    localStorage.removeItem(`session_id_${id}`);
                    
                    // Delay before trying again to ensure cleanup is complete
                    setTimeout(() => {
                      if (isMountedRef.current && socket) {
                        console.log('Attempting to reconnect after reset');
                        
                        // Close any existing connection
                        if (socket.connected) {
                          socket.disconnect();
                        }
                        
                        // Connect again after a short delay
                        setTimeout(() => {
                          if (isMountedRef.current && socket) {
                            socket.connect();
                          }
                        }, 500);
                      }
                    }, 1000);
          }}
          style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'white',
                    color: '#3498db',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
                    fontSize: '0.7rem'
          }}
        >
                  Retry
        </button>
                
                <button 
                  onClick={() => {
                    if (!isMountedRef.current) return;
                    
                    console.log('Force continue button clicked in sidebar - will attempt to create real session');
                    
                    // Instead of generating mock data, try to reconnect the socket
                    if (socket && !socket.connected) {
                      socket.connect();
                      console.log('Attempting to reconnect socket...');
                    }
                    
                    // Try to create a real session
                    if (socket && socket.connected) {
                      console.log('Socket connected, trying to create real session');
                      socket.emit('create-session', {
                        presentationId: id,
                        presenterName: user?.name || 'Anonymous Presenter'
                      });
                      setSessionCreationAttempted(true);
                    } else {
                      console.log('Socket not connected, cannot create session');
                      setErrorDetails('Socket not connected. Please try again or refresh the page.');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'white',
                    color: '#e67e22',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                  }}
                >
                  Force Continue
                </button>
            </div>
            </div>
          ) : null}

          <ActivityList>
            {activities.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p>No activities found for this presentation.</p>
              </div>
            ) : activities.map((activity) => {
              // Ensure activity has required properties
              if (!activity || !activity._id) {
                console.warn('Invalid activity object:', activity);
                return null;
              }

              // Format activity type
              const activityType = activity.type || 'unknown';
              const formattedType = activityType.charAt(0).toUpperCase() + activityType.slice(1);
              
              // Get activity title
              const activityTitle = activity.title || activity.question || 'Untitled Activity';
              
              return (
                <ActivityItem
                  key={activity._id}
                  $active={activeActivity && activeActivity._id === activity._id}
                  onClick={() => handleActivateActivity(activity)}
                  style={{
                    opacity: !connected || !sessionReady ? 0.7 : 1,
                    cursor: !connected || !sessionReady ? 'not-allowed' : 'pointer'
                  }}
                  title={!connected ? 
                    "Not connected to server" : 
                    !sessionReady ? 
                    "Session initialization in progress" : 
                    `Activate: ${activityTitle}`}
                >
                  <div>
                    {getActivityIcon(activityType)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activityTitle}
                    </div>
                    <ActivityType $active={activeActivity && activeActivity._id === activity._id}>
                      {formattedType}
                    </ActivityType>
                  </div>
                </ActivityItem>
              );
            })}
          </ActivityList>
        </SidebarSection>
      </Sidebar>
      
      <MainContent ref={mainContentRef} style={{ padding: isFullscreen ? 0 : undefined, borderRadius: isFullscreen ? 0 : undefined, minHeight: isFullscreen ? '100vh' : undefined, background: isFullscreen ? 'transparent' : undefined }}>
        {isFullscreen && (
          <FullscreenOverlay>
            <FullscreenExitButton
              aria-label="Exit Fullscreen"
              onClick={() => setIsFullscreen(false)}
            >
              &#10005;
            </FullscreenExitButton>
            {/* Floating QR and URL */}
            {showFloatingQR ? (
              <FloatingQRContainer>
                <QRCode value={window.location.origin + '/join/' + (presentation?.sessionCode || '')} size={72} />
                <div style={{ fontSize: '0.8rem', marginTop: 8, wordBreak: 'break-all', color: '#333', textAlign: 'center', maxWidth: 180 }}>
                  {window.location.origin + '/join/' + (presentation?.sessionCode || '')}
                </div>
                <FloatingQRHideButton title="Hide QR and URL" onClick={() => setShowFloatingQR(false)}>
                  &#128065; Hide
                </FloatingQRHideButton>
              </FloatingQRContainer>
            ) : (
              <FloatingQRShowButton title="Show QR and URL" onClick={() => setShowFloatingQR(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </FloatingQRShowButton>
            )}
            <FullscreenContent>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%' }}>
                  {/* Centered and responsive results container */}
                  <ResultsContainer style={{ minHeight: '90vh', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderActivityResults()}
                  </ResultsContainer>
                </div>
              </div>
            </FullscreenContent>
          </FullscreenOverlay>
        )}
        {!isFullscreen && (
          <>
            {activeActivity ? (
              <>
                <ActionBar>
                  <ActivityTitle>
                    {activeActivity.title || activeActivity.question}
                  </ActivityTitle>
                  <ButtonGroup>
                    <ExportButton
                      type={activeActivity.type}
                      itemId={activeActivity._id}
                      presentationId={id}
                      disabled={!connected && connectionAttempts < 3}
                    />
                    <Button
                      $variant="danger"
                      onClick={handleEndActivity}
                    >
                      End Activity
                    </Button>
                    {/* Fullscreen Toggle Button */}
                    <Button
                      $variant="primary"
                      onClick={() => setIsFullscreen(true)}
                      aria-label="Enter Fullscreen"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8-16h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3"/></svg>
                    </Button>
                  </ButtonGroup>
                </ActionBar>
                <StatsPanel>
                  <StatItem>
                    <StatValue>{participantCount}</StatValue>
                    <StatLabel>Participants</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{responseCount}</StatValue>
                    <StatLabel>Responses</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>
                      {participantCount > 0
                        ? Math.round((responseCount / participantCount) * 100)
                        : 0}%
                    </StatValue>
                    <StatLabel>Response Rate</StatLabel>
                  </StatItem>
                </StatsPanel>
                <ResultsContainer>
                  {renderActivityResults()}
                </ResultsContainer>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60%',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <h2>Select an activity to start</h2>
                <p>No activity is currently active. Select an activity from the sidebar to begin.</p>
                {!connected && connectionAttempts >= 3 && (
                  <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    maxWidth: '550px'
                  }}>
                    <h3 style={{ color: '#f39c12' }}>Connection Issues Detected</h3>
                    <p>We're having trouble connecting to the server. Please check your internet connection.</p>
                    <p>Try reconnecting or refreshing the page.</p>
                    <button
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (socket) {
                          socket.connect();
                          console.log('Manual connection attempt initiated');
                          success('Reconnection attempt initiated');
                        }
                      }}
                    >
                      Try Reconnecting
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </MainContent>
    </Container>
  );
};

export default PresentationView;
