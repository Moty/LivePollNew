import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const HeroSection = styled.section`
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary} 0%, 
    ${({ theme }) => theme.colors.primary + 'CC'} 100%
  );
  color: ${({ theme }) => theme.colors.text.light};
  padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  text-align: center;
`;

const HeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-weight: 700;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 1.25rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: center;
  }
`;

const Button = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background-color: ${({ theme, primary }) => 
    primary ? '#FFFFFF' : 'transparent'};
  color: ${({ theme, primary }) => 
    primary ? theme.colors.primary : '#FFFFFF'};
  border: 2px solid ${({ theme, primary }) => 
    primary ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.default};
  min-width: 180px;
  text-align: center;
  
  &:hover {
    background-color: ${({ theme, primary }) => 
      primary ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-3px);
  }
`;

const Section = styled.section`
  padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  background-color: ${({ theme, alternate }) => 
    alternate ? theme.colors.background.secondary : theme.colors.background.primary};
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-weight: 700;
  font-size: 2.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 2rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  transition: transform ${({ theme }) => theme.transitions.default};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const FeatureIcon = styled.div`
  width: 70px;
  height: 70px;
  background-color: ${({ theme }) => theme.colors.primary + '20'};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.primary};
  
  svg {
    width: 35px;
    height: 35px;
  }
`;

const FeatureTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StepsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const StepItem = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const StepNumber = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-right: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    margin-right: 0;
  }
`;

const StepContent = styled.div`
  flex-grow: 1;
`;

const StepTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const StepDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CtaSection = styled.section`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.light};
  padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-weight: 700;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 2rem;
  }
`;

const CtaDescription = styled.p`
  font-size: 1.25rem;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const CtaButton = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  background-color: white;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  font-weight: 600;
  font-size: 1.125rem;
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-3px);
  }
`;

const JoinSessionContainer = styled.div`
  display: flex;
  max-width: 500px;
  margin: ${({ theme }) => theme.spacing.xl} auto 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const JoinSessionInput = styled.input`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme, isMobile }) => 
    isMobile 
      ? theme.borderRadius.default 
      : `${theme.borderRadius.default} 0 0 ${theme.borderRadius.default}`};
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.borderRadius.default};
  }
`;

const JoinButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background-color: white;
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme, isMobile }) => 
    isMobile 
      ? theme.borderRadius.default 
      : `0 ${theme.borderRadius.default} ${theme.borderRadius.default} 0`};
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.borderRadius.default};
  }
`;

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = React.useState('');
  const isMobile = window.innerWidth <= 576;
  
  const handleJoinSession = (e) => {
    e.preventDefault();
    if (sessionCode.trim()) {
      navigate(`/join/${sessionCode.trim()}`);
    }
  };

  return (
    <>
      <HeroSection>
        <HeroContainer>
          <HeroTitle>Make Your Presentations Interactive</HeroTitle>
          <HeroSubtitle>
            Engage your audience with real-time polls, quizzes, word clouds, and Q&A sessions
          </HeroSubtitle>
          
          <JoinSessionContainer>
            <JoinSessionInput
              type="text"
              placeholder="Enter session code"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              isMobile={isMobile}
            />
            <JoinButton 
              onClick={handleJoinSession}
              isMobile={isMobile}
            >
              Join Session
            </JoinButton>
          </JoinSessionContainer>
          
          <ButtonGroup>
            {currentUser ? (
              <Button to="/dashboard" primary>
                Go to Dashboard
              </Button>
            ) : (
              <Button to="/login" primary>
                Sign In
              </Button>
            )}
            <Button to="/about">
              Learn More
            </Button>
          </ButtonGroup>
        </HeroContainer>
      </HeroSection>
      
      <Section>
        <SectionContainer>
          <SectionTitle>Features</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </FeatureIcon>
              <FeatureTitle>Interactive Polls</FeatureTitle>
              <FeatureDescription>
                Create real-time polls to gather audience opinion and display results instantly.
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </FeatureIcon>
              <FeatureTitle>Engaging Quizzes</FeatureTitle>
              <FeatureDescription>
                Test knowledge with interactive quizzes featuring automatic scoring and leaderboards.
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </FeatureIcon>
              <FeatureTitle>Q&A Sessions</FeatureTitle>
              <FeatureDescription>
                Enable participants to submit questions that can be upvoted and addressed live.
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </SectionContainer>
      </Section>
      
      <Section alternate>
        <SectionContainer>
          <SectionTitle>How It Works</SectionTitle>
          <StepsContainer>
            <StepItem>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Create your presentation</StepTitle>
                <StepDescription>
                  Sign in and create a new presentation with the activities you want to include: polls, quizzes, word clouds, or Q&A sessions.
                </StepDescription>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Share with your audience</StepTitle>
                <StepDescription>
                  Start your presentation and share the unique session code with your audience to join on their devices.
                </StepDescription>
              </StepContent>
            </StepItem>
            
            <StepItem>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Engage in real-time</StepTitle>
                <StepDescription>
                  Launch activities during your presentation and watch as responses come in instantly, keeping everyone engaged.
                </StepDescription>
              </StepContent>
            </StepItem>
          </StepsContainer>
        </SectionContainer>
      </Section>
      
      <CtaSection>
        <SectionContainer>
          <CtaTitle>Ready to create interactive presentations?</CtaTitle>
          <CtaDescription>
            Sign up today and start engaging your audience like never before.
          </CtaDescription>
          <CtaButton to={currentUser ? "/dashboard" : "/login"}>
            {currentUser ? "Go to Dashboard" : "Get Started for Free"}
          </CtaButton>
        </SectionContainer>
      </CtaSection>
    </>
  );
};

export default Home;