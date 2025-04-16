import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, isWarning, isDanger }) => 
    isDanger 
      ? theme.colors.error + '20' 
      : isWarning 
        ? theme.colors.warning + '20' 
        : theme.colors.background.secondary};
  color: ${({ theme, isWarning, isDanger }) => 
    isDanger 
      ? theme.colors.error 
      : isWarning 
        ? theme.colors.warning 
        : theme.colors.text.primary};
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const TimerIconWrapper = styled.div`
  margin-right: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  animation: ${({ isActive }) => isActive ? 'pulse 1s infinite' : 'none'};
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
`;

const TimerSvgIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: ${({ theme, isWarning, isDanger }) => 
    isDanger 
      ? theme.colors.error 
      : isWarning 
        ? theme.colors.warning 
        : theme.colors.text.primary};
`;

const TimerDisplay = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.body};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: 2px;
  margin-left: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: ${({ theme, isWarning, isDanger }) => 
    isDanger 
      ? theme.colors.error 
      : isWarning 
        ? theme.colors.warning 
        : theme.colors.primary};
  width: ${({ progress }) => `${progress}%`};
  transition: width 0.1s linear;
`;

/**
 * Countdown Timer Component
 * 
 * @param {Object} props
 * @param {number} props.duration - Duration in seconds
 * @param {boolean} props.isActive - Whether the timer is active
 * @param {function} props.onComplete - Callback when timer completes
 * @param {function} props.onTick - Callback for each second that passes
 * @param {boolean} props.showProgress - Whether to show progress bar
 */
const CountdownTimer = ({ 
  duration = 30,
  isActive = true,
  onComplete = () => {},
  onTick = () => {},
  showProgress = true
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(!isActive);
  
  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);
  
  // Update active state when isActive prop changes
  useEffect(() => {
    setIsPaused(!isActive);
  }, [isActive]);
  
  const completeTimer = useCallback(() => {
    setTimeLeft(0);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);
  
  // Timer logic
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(timerId);
          completeTimer();
          return 0;
        }
        if (onTick) {
          onTick(newTime);
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [isPaused, timeLeft, onTick, completeTimer]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = (timeLeft / duration) * 100;
  
  // Determine warning and danger states
  const isWarning = timeLeft <= duration * 0.5 && timeLeft > duration * 0.25;
  const isDanger = timeLeft <= duration * 0.25;
  
  return (
    <TimerContainer isWarning={isWarning} isDanger={isDanger} data-testid="countdown-timer">
      <TimerIconWrapper isActive={isActive && timeLeft > 0}>
        <TimerSvgIcon viewBox="0 0 24 24" isWarning={isWarning} isDanger={isDanger}>
          <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </TimerSvgIcon>
      </TimerIconWrapper>
      <TimerDisplay>
        {formatTime(timeLeft)}
      </TimerDisplay>
      {showProgress && (
        <ProgressBarContainer>
          <ProgressFill 
            progress={progressPercentage} 
            isWarning={isWarning} 
            isDanger={isDanger} 
          />
        </ProgressBarContainer>
      )}
    </TimerContainer>
  );
};

export default CountdownTimer;
