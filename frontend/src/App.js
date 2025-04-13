import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import theme from './styles/theme';
import GlobalStyle from './styles/GlobalStyle';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notifications from './components/common/Notifications';
import CreatePresentation from './pages/CreatePresentation';
import EditPresentation from './pages/EditPresentation';
import PresentationView from './pages/PresentationView';
import ParticipantView from './pages/ParticipantView';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Header />
            <Notifications />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create" 
                  element={
                    <ProtectedRoute>
                      <CreatePresentation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit/:id" 
                  element={
                    <ProtectedRoute>
                      <EditPresentation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/present/:id" 
                  element={
                    <ProtectedRoute>
                      <PresentationView />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/join/:code" element={<ParticipantView />} />
              </Routes>
            </main>
            <Footer />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
