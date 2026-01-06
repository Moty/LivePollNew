import axios from 'axios';

// Check if we're in development mode with auth bypass enabled
const isDevAuthBypass = process.env.NODE_ENV === 'development' &&
                        process.env.REACT_APP_ALLOW_DEV_AUTH_BYPASS === 'true';

// Helper function to handle API errors consistently
const handleApiError = (error) => {
  // Only log in development to avoid console noise in production
  if (process.env.NODE_ENV === 'development') {
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('API No Response Error:', error.request);
    } else {
      console.error('API Request Error:', error.message);
    }
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (set by AuthContext)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('API response error:', error.response.status, error.response.data);
      }

      // Handle auth errors
      if (error.response.status === 401) {
        // Clear auth data on 401 (unless dev bypass is enabled)
        if (!isDevAuthBypass) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Optionally redirect to login
          // window.location.href = '/login';
        }
      }
    } else if (error.request && process.env.NODE_ENV === 'development') {
      // The request was made but no response was received
      console.error('API no response error:', error.request);
    } else if (process.env.NODE_ENV === 'development') {
      // Something else happened in making the request
      console.error('API request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Add a helper method to normalize responses
const normalizeResponse = (response) => {
  // If the response has a data property, return it as is
  if (response && response.data !== undefined) {
    return response;
  }
  
  // If the response is directly the data (for backward compatibility)
  return { data: response || [] };
};

// API service methods
const apiService = {
  // Presentations
  getPresentations: async () => {
    try {
      const response = await api.get('/presentations');
      return normalizeResponse(response.data);
    } catch (error) {
      handleApiError(error);
      return { data: [] }; // Return a valid empty data structure
    }
  },
  
  getPresentation: async (id) => {
    try {
      if (!id) {
        console.error('Invalid ID provided to getPresentation:', id);
        return { data: null };
      }
      
      const response = await api.get(`/presentations/${id}`);
      return normalizeResponse(response.data);
    } catch (error) {
      handleApiError(error);
      return { data: null }; // Return a valid empty data structure
    }
  },
  
  createPresentation: async (presentationData) => {
    try {
      const response = await api.post('/presentations', presentationData);
      return normalizeResponse(response.data);
    } catch (error) {
      handleApiError(error);
      throw error; // Rethrow to allow caller to handle
    }
  },
  
  updatePresentation: async (id, presentationData) => {
    try {
      if (!id) {
        console.error('Invalid ID provided to updatePresentation:', id);
        return { data: null };
      }
      
      const response = await api.put(`/presentations/${id}`, presentationData);
      return normalizeResponse(response.data);
    } catch (error) {
      handleApiError(error);
      throw error; // Rethrow to allow caller to handle
    }
  },
  
  deletePresentation: async (id) => {
    try {
      if (!id) {
        console.error('Invalid ID provided to deletePresentation:', id);
        return { data: null };
      }
      
      const response = await api.delete(`/presentations/${id}`);
      return normalizeResponse(response.data);
    } catch (error) {
      handleApiError(error);
      throw error; // Rethrow to allow caller to handle
    }
  },
  
  // Sessions
  // -------------------------
  createSession: (presentationId, payload = {}) => api.post(`/presentations/${presentationId}/sessions`, payload),
  listSessions: (presentationId) => api.get(`/presentations/${presentationId}/sessions`),
  getSessionResults: (sessionId, pollId = null, asCsv = false) => {
    const headers = asCsv ? { Accept: 'text/csv' } : {};
    const params = pollId ? { pollId } : {};
    return api.get(`/sessions/${sessionId}/results`, { headers, params, responseType: asCsv ? 'blob' : 'json' });
  },

  // Polls
  getPolls: () => api.get('/polls'),
  getPoll: (id) => api.get(`/polls/${id}`),
  createPoll: (data) => api.post('/polls', data),
  
  // Quizzes
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (data) => api.post('/quizzes', data),
  
  // Word Clouds
  getWordClouds: () => api.get('/wordclouds'),
  getWordCloud: (id) => api.get(`/wordclouds/${id}`),
  createWordCloud: (data) => api.post('/wordclouds', data),
  
  // Q&A
  getQAs: () => api.get('/qa'),
  getQA: (id) => api.get(`/qa/${id}`),
  createQA: (data) => api.post('/qa', data),
  
  // Server Health
  checkServerHealth: () => api.get('/health')
};

export default apiService;