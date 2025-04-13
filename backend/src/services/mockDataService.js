/**
 * mockDataService.js
 * Provides mock data for development when database isn't available
 */
const fs = require('fs');
const path = require('path');

// File paths for storing mock data
const DATA_DIR = path.join(__dirname, '../../data');
const PRESENTATIONS_FILE = path.join(DATA_DIR, 'mock_presentations.json');

// Make sure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default mock data
const defaultPresentations = [
  {
    _id: '1',
    title: 'Introduction to Web Development',
    description: 'Learn the basics of web development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      {
        _id: 'poll_1',
        type: 'poll',
        title: 'Programming Experience',
        question: 'How much programming experience do you have?',
        options: ['None', 'Beginner', 'Intermediate', 'Advanced'],
        responses: []
      },
      {
        _id: 'quiz_1',
        type: 'quiz',
        title: 'HTML Basics Quiz',
        question: 'Test your HTML knowledge',
        questions: [
          {
            text: 'What does HTML stand for?',
            options: [
              'Hyper Text Markup Language',
              'High Tech Modern Language',
              'Hyper Transfer Markup Language',
              'Home Tool Markup Language'
            ],
            correctIndex: 0
          }
        ],
        responses: []
      },
      {
        _id: 'wordcloud_1',
        type: 'wordcloud',
        title: 'Web Development Concepts',
        question: 'What words come to mind when you think of web development?',
        maxSubmissions: 3,
        responses: []
      }
    ]
  },
  {
    _id: '2',
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      {
        _id: 'poll_2',
        type: 'poll',
        title: 'JavaScript Framework Experience',
        question: 'Which JavaScript framework do you use most?',
        options: ['React', 'Vue', 'Angular', 'Svelte', 'None'],
        responses: []
      },
      {
        _id: 'quiz_2',
        type: 'quiz',
        title: 'JavaScript Basics',
        question: 'Test your JavaScript knowledge',
        questions: [
          {
            text: 'What is the correct way to declare a variable in JavaScript?',
            options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'x := 5;'],
            correctIndex: 0
          }
        ],
        responses: []
      }
    ]
  }
];

// Load presentations from file or use defaults
let mockPresentations = [];
try {
  if (fs.existsSync(PRESENTATIONS_FILE)) {
    const fileData = fs.readFileSync(PRESENTATIONS_FILE, 'utf8');
    mockPresentations = JSON.parse(fileData);
    console.log(`Loaded ${mockPresentations.length} presentations from file`);
  } else {
    mockPresentations = defaultPresentations;
    // Save default presentations
    fs.writeFileSync(PRESENTATIONS_FILE, JSON.stringify(mockPresentations, null, 2));
    console.log('Created default presentations file');
  }
} catch (error) {
  console.error('Error loading mock presentations:', error);
  mockPresentations = defaultPresentations;
}

// Helper function to save presentations to file
const savePresentations = () => {
  try {
    fs.writeFileSync(PRESENTATIONS_FILE, JSON.stringify(mockPresentations, null, 2));
    console.log('Saved presentations to file');
  } catch (error) {
    console.error('Error saving presentations to file:', error);
  }
};

// Mock Polls
const mockPolls = [
  {
    id: 201,
    title: "Favorite React Feature",
    question: "What's your favorite React feature?",
    options: ["Components", "Hooks", "Context API", "Virtual DOM", "JSX Syntax"],
    created_by: "dev-user",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 204,
    title: "ES6 Features",
    question: "Which ES6 feature do you use most often?",
    options: ["Arrow Functions", "Destructuring", "Spread Syntax", "Template Literals", "Classes"],
    created_by: "dev-user",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Mock Quizzes
const mockQuizzes = [
  {
    id: 202,
    title: "React Knowledge Check",
    questions: [
      {
        text: "What function is used to update state in a functional component?",
        options: ["setState", "useState", "changeState", "updateState"],
        correctIndex: 1
      }
    ],
    created_by: "dev-user",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock WordClouds
const mockWordClouds = [
  {
    id: 203,
    title: "React Associations",
    description: "Enter words you associate with React",
    maxSubmissions: 3,
    created_by: "dev-user",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock QAs
const mockQAs = [
  {
    id: 205,
    title: "JavaScript Q&A Session",
    description: "Ask anything about JavaScript design patterns",
    created_by: "dev-user",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Helper functions to simulate database operations
const mockDataService = {
  // Presentations
  getPresentations: (userId) => {
    return mockPresentations.map(p => ({
      ...p,
      activities: undefined,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString()
    }));
  },

  getPresentation: (id) => {
    console.log('Mock service: Getting presentation with ID:', id);
    
    // Handle null or undefined id
    if (id === null || id === undefined) {
      console.log('Mock service: Invalid ID (null or undefined)');
      return null;
    }
    
    // Convert id to string for comparison
    const idStr = id.toString();
    
    // Find presentation by _id with safer property access
    const presentation = mockPresentations.find(p => {
      // Make sure p and p._id exist before calling toString()
      if (!p || !p._id) return false;
      return p._id.toString() === idStr;
    });
    
    if (!presentation) {
      console.log('Mock service: Presentation not found for ID:', id);
      return null;
    }
    
    console.log('Mock service: Found presentation:', presentation.title);
    
    // Return a deep copy with properly formatted activities
    return {
      ...presentation,
      activities: (presentation.activities || []).map(activity => ({
        ...activity,
        _id: activity._id || `temp_${Date.now()}`,
        type: activity.type || 'unknown',
        title: activity.title || '',
        question: activity.question || '',
        responses: activity.responses || []
      }))
    };
  },

  createPresentation: (data) => {
    // Generate a new ID for the presentation with more robust approach
    let highestId = 0;
    
    // Find the highest numeric ID
    mockPresentations.forEach(p => {
      if (p && p._id) {
        try {
          const id = parseInt(p._id);
          if (!isNaN(id) && id > highestId) {
            highestId = id;
          }
        } catch (e) {
          // Skip this ID if it can't be parsed
        }
      }
    });
    
    // Ensure we have a valid numeric ID
    const newId = (highestId + 1).toString();
    console.log(`Generated new presentation ID: ${newId}`);
    
    const now = new Date().toISOString();
    
    // Format activities with proper IDs and structure
    const activities = data.activities?.map((activity, index) => {
      const activityTypePrefix = activity.type || 'activity';
      const activityId = `${activityTypePrefix}_${Date.now()}_${index}`;
      
      const baseActivity = {
        _id: activityId,
        type: activity.type || 'poll',
        title: activity.title || `Activity ${index + 1}`,
        responses: []
      };
      
      // Add activity-specific properties
      switch (activity.type) {
        case 'poll':
          return {
            ...baseActivity,
            question: activity.question || activity.title || 'Default Question',
            options: activity.options || ['Option 1', 'Option 2', 'Option 3']
          };
        case 'quiz':
          return {
            ...baseActivity,
            question: activity.question || activity.title || 'Default Question',
            questions: activity.questions || [
              {
                text: 'Default Question',
                options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                correctIndex: 0
              }
            ]
          };
        case 'wordcloud':
          return {
            ...baseActivity,
            question: activity.question || activity.title || 'Enter some words...',
            maxSubmissions: activity.maxSubmissions || 3
          };
        case 'qa':
          return {
            ...baseActivity,
            question: activity.question || activity.title || 'Ask a question...',
            isModerated: activity.isModerated || false
          };
        default:
          return baseActivity;
      }
    }) || [];
    
    const newPresentation = {
      _id: newId,
      title: data.title || 'Untitled Presentation',
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
      activities: activities
    };
    
    console.log('Creating new presentation:', newPresentation.title, 'with ID:', newId);
    mockPresentations.push(newPresentation);
    
    // Save to file
    savePresentations();
    
    return newId;
  },

  updatePresentation: (id, data) => {
    const index = mockPresentations.findIndex(p => p._id.toString() === id.toString());
    
    if (index === -1) {
      return null;
    }
    
    // Update the presentation
    mockPresentations[index] = {
      ...mockPresentations[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // Save to file
    savePresentations();
    
    return mockPresentations[index];
  },

  deletePresentation: (id) => {
    const index = mockPresentations.findIndex(p => p._id.toString() === id.toString());
    
    if (index === -1) {
      return false;
    }
    
    mockPresentations.splice(index, 1);
    
    // Save to file
    savePresentations();
    
    return true;
  },

  // Polls
  getPolls: () => mockPolls,
  getPoll: (id) => mockPolls.find(p => p.id.toString() === id.toString()),

  // Quizzes
  getQuizzes: () => mockQuizzes,
  getQuiz: (id) => mockQuizzes.find(q => q.id.toString() === id.toString()),

  // WordClouds
  getWordClouds: () => mockWordClouds,
  getWordCloud: (id) => mockWordClouds.find(w => w.id.toString() === id.toString()),

  // QAs
  getQAs: () => mockQAs,
  getQA: (id) => mockQAs.find(q => q.id.toString() === id.toString())
};

module.exports = mockDataService;