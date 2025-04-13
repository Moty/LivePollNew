import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotification } from '../../contexts/NotificationContext';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.spacing.xl};
  right: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  max-width: 350px;
  z-index: 1000;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: ${({ theme }) => theme.spacing.md};
    right: ${({ theme }) => theme.spacing.md};
    left: ${({ theme }) => theme.spacing.md};
  }
`;

const NotificationItem = styled.div`
  background-color: ${({ theme, type }) => {
    switch (type) {
      case 'success':
        return theme.colors.accent;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  }};
  color: ${({ theme, type }) => 
    type === 'info' || type === 'success' ? '#FFFFFF' : '#333333'};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: ${slideIn} 0.3s ease;
  position: relative;
`;

const NotificationContent = styled.div`
  flex-grow: 1;
  margin-right: ${({ theme }) => theme.spacing.md};
`;

const Message = styled.div`
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  &:hover {
    opacity: 1;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.5);
  width: ${({ $progress }) => `${$progress}%`};
  transition: width linear;
`;

const Notifications = () => {
  const { notifications, dismiss } = useNotification();
  
  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          type={notification.type}
        >
          <NotificationContent>
            <Message>{notification.message}</Message>
          </NotificationContent>
          <CloseButton onClick={() => dismiss(notification.id)}>
            ×
          </CloseButton>
          {notification.duration > 0 && (
            <ProgressBar $progress={100} />
          )}
        </NotificationItem>
      ))}
    </NotificationContainer>
  );
};

export default Notifications;