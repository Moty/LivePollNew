import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const CardTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ChartContainer = styled.div`
  height: 250px;
  position: relative;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.default};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
  
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const AnalyticsDashboard = ({ presentationId }) => {
  const { error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  // TODO: Implement analytics data fetching from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // In a production app, we would call an actual API
        // const response = await axios.get(`/api/analytics/presentations/${presentationId}`);
        // const data = response.data;
        
        // Using mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = {
          participantCount: 83,
          activityCount: 12,
          averageEngagement: 78,
          mostActiveTime: '14:30 - 15:00',
          
          engagementByActivity: {
            labels: ['Polls', 'Quizzes', 'Word Cloud', 'Q&A'],
            datasets: [
              {
                label: 'Participation Rate (%)',
                data: [84, 67, 91, 72],
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
              },
            ],
          },
          
          deviceDistribution: {
            labels: ['Mobile', 'Tablet', 'Desktop'],
            datasets: [
              {
                data: [58, 15, 27],
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
              },
            ],
          },
        };
        
        setAnalytics(mockData);
        setLoading(false);
      } catch (err) {
        showError('Failed to fetch analytics data');
        console.error(err);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [presentationId, showError]);
  
  if (loading) {
    return (
      <Container>
        <Title>Analytics Dashboard</Title>
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
  
  if (!analytics) {
    return (
      <Container>
        <Title>Analytics Dashboard</Title>
        <EmptyState>No analytics data available for this presentation.</EmptyState>
      </Container>
    );
  }
  
  return (
    <Container>
      <Title>Analytics Dashboard</Title>
      
      {/* TODO: Add date range filter for analytics */}
      {/* <DateRangeFilter onChange={handleDateRangeChange} /> */}
      
      <StatGrid>
        <StatCard>
          <StatValue>{analytics.participantCount}</StatValue>
          <StatLabel>Participants</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.activityCount}</StatValue>
          <StatLabel>Activities</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.averageEngagement}%</StatValue>
          <StatLabel>Avg. Engagement</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.mostActiveTime}</StatValue>
          <StatLabel>Peak Activity</StatLabel>
        </StatCard>
      </StatGrid>
      
      <DashboardGrid>
        {/* Engagement by Activity Type */}
        <Card>
          <CardTitle>Engagement by Activity Type</CardTitle>
          <ChartContainer>
            <Bar 
              data={analytics.engagementByActivity} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }} 
            />
          </ChartContainer>
        </Card>
        
        {/* Device Distribution */}
        <Card>
          <CardTitle>Device Distribution</CardTitle>
          <ChartContainer>
            <Doughnut 
              data={analytics.deviceDistribution} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} 
            />
          </ChartContainer>
        </Card>
        
        {/* TODO: Add more analytics visualizations */}
        {/* 
        <Card>
          <CardTitle>Response Time Distribution</CardTitle>
          <ChartContainer>
            <!-- Time-based chart for response data -->
          </ChartContainer>
        </Card>
        
        <Card>
          <CardTitle>Geographic Distribution</CardTitle>
          <ChartContainer>
            <!-- Map visualization -->
          </ChartContainer>
        </Card> 
        */}
      </DashboardGrid>

      {/* TODO: Implement activity-specific analytics section */}
      {/* 
      <Section>
        <SectionTitle>Poll Analytics</SectionTitle>
        <!-- Detailed analytics for poll responses -->
      </Section>

      <Section>
        <SectionTitle>Quiz Results</SectionTitle>
        <!-- Detailed analytics for quiz performance -->
      </Section>
      */}
      
      {/* TODO: Implement export functionality */}
      {/*
      <ExportSection>
        <Button onClick={handleExportCSV}>Export to CSV</Button>
        <Button onClick={handleExportPDF}>Generate PDF Report</Button>
      </ExportSection>
      */}
    </Container>
  );
};

export default AnalyticsDashboard;