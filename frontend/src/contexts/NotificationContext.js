import React, { createContext, useState, useContext, useCallback } from 'react';

// Create notification context
const NotificationContext = createContext();

// Hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Generate a unique ID for notifications
let notificationCounter = 0;
const generateUniqueId = () => {
  notificationCounter += 1;
  return `${Date.now()}_${notificationCounter}`;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a notification
  const notify = useCallback((message, type = 'info', duration = 5000) => {
    const id = generateUniqueId();
    
    // Add new notification
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { id, message, type, duration }
    ]);
    
    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, []);

  // Remove a notification by ID
  const dismiss = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // Shorthand methods for different notification types
  const success = useCallback((message, duration) => notify(message, 'success', duration), [notify]);
  const error = useCallback((message, duration) => notify(message, 'error', duration), [notify]);
  const warning = useCallback((message, duration) => notify(message, 'warning', duration), [notify]);
  const info = useCallback((message, duration) => notify(message, 'info', duration), [notify]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    notify,
    dismiss,
    success,
    error,
    warning,
    info,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;