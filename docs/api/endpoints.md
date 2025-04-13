# LearnConnectLive API Endpoints Reference

This document provides a comprehensive reference for the RESTful API endpoints available in the LearnConnectLive platform.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5001/api  # Development
https://api.learnconnectlive.com/api  # Production
```

## Authentication

Most endpoints require authentication using a JWT token provided in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Error Handling

All endpoints follow a standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context-specific information
    }
  }
}
```

Common error codes:
- `INVALID_REQUEST`: Malformed request
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `VALIDATION_ERROR`: Input validation failed

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and get a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12346",
    "email": "newuser@example.com",
    "name": "Jane Doe"
  }
}
```

#### GET /auth/me

Get the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Presentations

#### GET /presentations

Get a list of presentations for the authenticated user.

**Query Parameters:**
- `search` (optional): Search term
- `limit` (optional): Maximum number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (default: "createdAt")
- `order` (optional): Sort order ("asc" or "desc", default: "desc")

**Response:**
```json
{
  "presentations": [
    {
      "id": "pres-123",
      "title": "Introduction to React",
      "description": "A beginner's guide to React",
      "createdAt": "2025-03-15T14:30:00Z",
      "updatedAt": "2025-03-16T10:15:00Z",
      "activitiesCount": 4
    },
    {
      "id": "pres-124",
      "title": "Advanced JavaScript",
      "description": "Deep dive into JavaScript concepts",
      "createdAt": "2025-03-10T09:45:00Z",
      "updatedAt": "2025-03-12T16:20:00Z",
      "activitiesCount": 6
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

#### GET /presentations/:id

Get a specific presentation by ID.

**Response:**
```json
{
  "presentation": {
    "id": "pres-123",
    "title": "Introduction to React",
    "description": "A beginner's guide to React",
    "createdAt": "2025-03-15T14:30:00Z",
    "updatedAt": "2025-03-16T10:15:00Z",
    "activities": [
      {
        "id": "act-456",
        "type": "poll",
        "title": "React Experience",
        "config": {
          "question": "How much experience do you have with React?",
          "options": ["None", "Beginner", "Intermediate", "Advanced"]
        }
      },
      {
        "id": "act-457",
        "type": "quiz",
        "title": "React Basics Quiz",
        "config": {
          "questions": [
            {
              "text": "What is JSX?",
              "options": ["JavaScript XML", "Java Syntax Extension", "JavaScript Extra", "JavaScript XML Syntax"],
              "correctAnswer": 0
            }
          ]
        }
      }
    ]
  }
}
```

#### POST /presentations

Create a new presentation.

**Request Body:**
```json
{
  "title": "New Presentation",
  "description": "A great new presentation",
  "activities": [
    {
      "type": "poll",
      "title": "Technology Poll",
      "config": {
        "question": "Which technology do you use most?",
        "options": ["React", "Angular", "Vue", "Other"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "presentation": {
    "id": "pres-125",
    "title": "New Presentation",
    "description": "A great new presentation",
    "createdAt": "2025-04-10T15:45:00Z",
    "updatedAt": "2025-04-10T15:45:00Z",
    "activities": [
      {
        "id": "act-458",
        "type": "poll",
        "title": "Technology Poll",
        "config": {
          "question": "Which technology do you use most?",
          "options": ["React", "Angular", "Vue", "Other"]
        }
      }
    ]
  }
}
```

#### PUT /presentations/:id

Update a presentation.

**Request Body:**
```json
{
  "title": "Updated Presentation",
  "description": "An updated description"
}
```

**Response:**
```json
{
  "presentation": {
    "id": "pres-123",
    "title": "Updated Presentation",
    "description": "An updated description",
    "createdAt": "2025-03-15T14:30:00Z",
    "updatedAt": "2025-04-10T16:20:00Z",
    "activities": [...]
  }
}
```

#### DELETE /presentations/:id

Delete a presentation.

**Response:**
```json
{
  "success": true,
  "message": "Presentation deleted successfully"
}
```

### Activities

#### POST /presentations/:presentationId/activities

Add an activity to a presentation.

**Request Body:**
```json
{
  "type": "wordcloud",
  "title": "Programming Languages",
  "config": {
    "prompt": "What programming languages do you know?",
    "maxWords": 50,
    "filterProfanity": true
  }
}
```

**Response:**
```json
{
  "activity": {
    "id": "act-459",
    "type": "wordcloud",
    "title": "Programming Languages",
    "config": {
      "prompt": "What programming languages do you know?",
      "maxWords": 50,
      "filterProfanity": true
    }
  }
}
```

#### PUT /presentations/:presentationId/activities/:activityId

Update an activity.

**Request Body:**
```json
{
  "title": "Updated Activity Title",
  "config": {
    "prompt": "What programming languages do you use daily?",
    "maxWords": 30,
    "filterProfanity": true
  }
}
```

**Response:**
```json
{
  "activity": {
    "id": "act-459",
    "type": "wordcloud",
    "title": "Updated Activity Title",
    "config": {
      "prompt": "What programming languages do you use daily?",
      "maxWords": 30,
      "filterProfanity": true
    }
  }
}
```

#### DELETE /presentations/:presentationId/activities/:activityId

Delete an activity from a presentation.

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### Sessions

#### GET /sessions

Get a list of active sessions for the user.

**Response:**
```json
{
  "sessions": [
    {
      "id": "sess-789",
      "code": "ABC123",
      "presentationId": "pres-123",
      "title": "Introduction to React",
      "createdAt": "2025-04-10T14:00:00Z",
      "participantCount": 15,
      "activeActivity": {
        "id": "act-457",
        "type": "quiz",
        "title": "React Basics Quiz"
      }
    }
  ]
}
```

#### GET /sessions/:id

Get detailed information about a session.

**Response:**
```json
{
  "session": {
    "id": "sess-789",
    "code": "ABC123",
    "presentationId": "pres-123",
    "title": "Introduction to React",
    "createdAt": "2025-04-10T14:00:00Z",
    "updatedAt": "2025-04-10T15:30:00Z",
    "participants": [
      {
        "id": "part-001",
        "name": "Anonymous 1",
        "joinedAt": "2025-04-10T14:05:00Z"
      },
      {
        "id": "part-002",
        "name": "Jane",
        "joinedAt": "2025-04-10T14:10:00Z"
      }
    ],
    "activeActivity": {
      "id": "act-457",
      "type": "quiz",
      "title": "React Basics Quiz",
      "startedAt": "2025-04-10T15:00:00Z",
      "responses": 12
    },
    "activities": [
      {
        "id": "act-456",
        "type": "poll",
        "title": "React Experience",
        "startedAt": "2025-04-10T14:30:00Z",
        "endedAt": "2025-04-10T14:45:00Z",
        "responses": 15
      },
      {
        "id": "act-457",
        "type": "quiz",
        "title": "React Basics Quiz",
        "startedAt": "2025-04-10T15:00:00Z",
        "responses": 12
      }
    ]
  }
}
```

### Results

#### GET /sessions/:sessionId/results

Get the results for all activities in a session.

**Response:**
```json
{
  "sessionId": "sess-789",
  "presentationId": "pres-123",
  "title": "Introduction to React",
  "participants": 15,
  "results": [
    {
      "activityId": "act-456",
      "type": "poll",
      "title": "React Experience",
      "responses": 15,
      "data": {
        "options": ["None", "Beginner", "Intermediate", "Advanced"],
        "counts": [2, 8, 4, 1]
      }
    },
    {
      "activityId": "act-457",
      "type": "quiz",
      "title": "React Basics Quiz",
      "responses": 12,
      "data": {
        "questions": [
          {
            "text": "What is JSX?",
            "options": ["JavaScript XML", "Java Syntax Extension", "JavaScript Extra", "JavaScript XML Syntax"],
            "counts": [10, 1, 0, 1],
            "correctOption": 0
          }
        ],
        "leaderboard": [
          { "participant": "Jane", "score": 100 },
          { "participant": "Anonymous 1", "score": 0 }
        ]
      }
    }
  ]
}
```

#### GET /sessions/:sessionId/activities/:activityId/results

Get the results for a specific activity in a session.

**Response:** (for poll)
```json
{
  "activityId": "act-456",
  "type": "poll",
  "title": "React Experience",
  "responses": 15,
  "data": {
    "options": ["None", "Beginner", "Intermediate", "Advanced"],
    "counts": [2, 8, 4, 1]
  }
}
```

**Response:** (for quiz)
```json
{
  "activityId": "act-457",
  "type": "quiz",
  "title": "React Basics Quiz",
  "responses": 12,
  "data": {
    "questions": [
      {
        "text": "What is JSX?",
        "options": ["JavaScript XML", "Java Syntax Extension", "JavaScript Extra", "JavaScript XML Syntax"],
        "counts": [10, 1, 0, 1],
        "correctOption": 0
      }
    ],
    "leaderboard": [
      { "participant": "Jane", "score": 100 },
      { "participant": "Anonymous 1", "score": 0 }
    ]
  }
}
```

### Export

#### GET /sessions/:sessionId/export/csv

Export session results as CSV.

**Query Parameters:**
- `includeRaw` (optional): Include raw response data (default: false)
- `activities` (optional): Comma-separated list of activity IDs to include

**Response:**
A CSV file with session results.

#### GET /sessions/:sessionId/export/pdf

Export session results as PDF (not yet implemented).

**Query Parameters:**
- `template` (optional): PDF template to use (default: "standard")
- `activities` (optional): Comma-separated list of activity IDs to include

**Response:**
A PDF file with session results.

## Status Codes

The API uses the following status codes:

- `200 OK`: The request was successful
- `201 Created`: A resource was successfully created
- `400 Bad Request`: The request was malformed
- `401 Unauthorized`: Authentication is required
- `403 Forbidden`: The user does not have permission
- `404 Not Found`: The resource was not found
- `500 Internal Server Error`: An error occurred on the server

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When rate limited, the API will respond with a `429 Too Many Requests` status code and include a `Retry-After` header indicating when to try again.

## Versioning

The current API version is v1. The version is implied in the base URL but may be explicitly specified in the future as `/api/v1/resource`. 