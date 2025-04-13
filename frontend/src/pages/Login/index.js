import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const LoginContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Tab = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, active }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ theme, active }) => active ? theme.colors.text.light : theme.colors.text.primary};
  border: none;
  border-bottom: 2px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.background.secondary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, error }) => error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-size: ${({ theme }) => theme.fontSizes.body};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme, error }) => error ? theme.colors.error : theme.colors.primary};
  }
`;

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + 'DD'};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

const DividerContainer = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const Divider = styled.div`
  flex-grow: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

const DividerText = styled.span`
  padding: 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const SocialLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: white;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.md};
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`;

const SwitchText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  padding: 0 ${({ theme }) => theme.spacing.xs};
  
  &:hover {
    text-decoration: underline;
  }
`;

// Validation schemas
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const signupSchema = Yup.object({
  name: Yup.string()
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isAuthenticated } = useAuth();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const signupParam = queryParams.get('signup');
    const returnUrl = queryParams.get('returnUrl') || '/dashboard';
    
    // If signup=true is in the URL, show signup form
    if (signupParam === 'true') {
      setIsLogin(false);
    }
    
    // If already authenticated, redirect
    if (isAuthenticated) {
      navigate(returnUrl);
    }
  }, [location, isAuthenticated, navigate]);
  
  // Login form handling
  const loginFormik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        const result = await login(values.email, values.password);
        if (result.success) {
          // Get return URL from query params or default to dashboard
          const queryParams = new URLSearchParams(location.search);
          const returnUrl = queryParams.get('returnUrl') || '/dashboard';
          
          success('Login successful!');
          navigate(returnUrl);
        } else {
          showError(result.error || 'Login failed. Please check your credentials.');
        }
      } catch (err) {
        showError('An error occurred during login. Please try again.');
        console.error(err);
      }
    }
  });
  
  // Signup form handling
  const signupFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      try {
        const result = await register(values.name, values.email, values.password);
        if (result.success) {
          success('Account created successfully!');
          navigate('/dashboard');
        } else {
          showError(result.error || 'Registration failed. Please try again.');
        }
      } catch (err) {
        showError('An error occurred during sign up. Please try again.');
        console.error(err);
      }
    }
  });
  
  // Google login handler (would integrate with a real OAuth provider in production)
  const handleGoogleLogin = () => {
    showError('Google login is not implemented in this demo version.');
  };
  
  return (
    <LoginContainer>
      <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
      
      <Tabs>
        <Tab 
          active={isLogin} 
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </Tab>
        <Tab 
          active={!isLogin} 
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </Tab>
      </Tabs>
      
      {/* Social Login Buttons */}
      <SocialLoginButton onClick={handleGoogleLogin}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </SocialLoginButton>
      
      <DividerContainer>
        <Divider />
        <DividerText>OR</DividerText>
        <Divider />
      </DividerContainer>
      
      {isLogin ? (
        /* Login Form */
        <Form onSubmit={loginFormik.handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              name="email"
              type="email"
              error={loginFormik.touched.email && loginFormik.errors.email}
              value={loginFormik.values.email}
              onChange={loginFormik.handleChange}
              onBlur={loginFormik.handleBlur}
              placeholder="your@email.com"
            />
            {loginFormik.touched.email && loginFormik.errors.email && (
              <ErrorText>{loginFormik.errors.email}</ErrorText>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              name="password"
              type="password"
              error={loginFormik.touched.password && loginFormik.errors.password}
              value={loginFormik.values.password}
              onChange={loginFormik.handleChange}
              onBlur={loginFormik.handleBlur}
              placeholder="Your password"
            />
            {loginFormik.touched.password && loginFormik.errors.password && (
              <ErrorText>{loginFormik.errors.password}</ErrorText>
            )}
          </FormGroup>
          
          <Button type="submit" disabled={loginFormik.isSubmitting}>
            {loginFormik.isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <SwitchText>
            Don't have an account?
            <SwitchLink type="button" onClick={() => setIsLogin(false)}>
              Sign Up
            </SwitchLink>
          </SwitchText>
        </Form>
      ) : (
        /* Signup Form */
        <Form onSubmit={signupFormik.handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              name="name"
              type="text"
              error={signupFormik.touched.name && signupFormik.errors.name}
              value={signupFormik.values.name}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              placeholder="Your name"
            />
            {signupFormik.touched.name && signupFormik.errors.name && (
              <ErrorText>{signupFormik.errors.name}</ErrorText>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              name="email"
              type="email"
              error={signupFormik.touched.email && signupFormik.errors.email}
              value={signupFormik.values.email}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              placeholder="your@email.com"
            />
            {signupFormik.touched.email && signupFormik.errors.email && (
              <ErrorText>{signupFormik.errors.email}</ErrorText>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              name="password"
              type="password"
              error={signupFormik.touched.password && signupFormik.errors.password}
              value={signupFormik.values.password}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              placeholder="Create a password"
            />
            {signupFormik.touched.password && signupFormik.errors.password && (
              <ErrorText>{signupFormik.errors.password}</ErrorText>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              error={signupFormik.touched.confirmPassword && signupFormik.errors.confirmPassword}
              value={signupFormik.values.confirmPassword}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              placeholder="Confirm your password"
            />
            {signupFormik.touched.confirmPassword && signupFormik.errors.confirmPassword && (
              <ErrorText>{signupFormik.errors.confirmPassword}</ErrorText>
            )}
          </FormGroup>
          
          <Button type="submit" disabled={signupFormik.isSubmitting}>
            {signupFormik.isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
          
          <SwitchText>
            Already have an account?
            <SwitchLink type="button" onClick={() => setIsLogin(true)}>
              Sign In
            </SwitchLink>
          </SwitchText>
        </Form>
      )}
    </LoginContainer>
  );
};

export default Login;