-- Database initialization script for LivePoll interactive presentation tool

-- Create tables for user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- Access code for presentation
  title TEXT NOT NULL,
  created_by TEXT NOT NULL, -- User ID or email
  created_at TIMESTAMP NOT NULL,
  expired_at TIMESTAMP -- When the session becomes inactive
);

-- Create tables for polls
CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'multiple_choice', 'rating', 'open_ended'
  created_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_responses (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
  rating INTEGER, -- For rating type polls
  open_response TEXT, -- For open-ended polls
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  created_at TIMESTAMP NOT NULL
);

-- Create tables for word clouds
CREATE TABLE IF NOT EXISTS word_clouds (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS word_cloud_submissions (
  id SERIAL PRIMARY KEY,
  word_cloud_id INTEGER NOT NULL REFERENCES word_clouds(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  created_at TIMESTAMP NOT NULL
);

-- Create tables for quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 30 -- Time limit in seconds
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER, -- Time spent in seconds
  created_at TIMESTAMP NOT NULL
);

-- Create tables for Q&A
CREATE TABLE IF NOT EXISTS qa_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  moderation_enabled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  qa_session_id INTEGER NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  user_name TEXT, -- Optional display name
  is_hidden BOOLEAN NOT NULL DEFAULT false, -- For moderation
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS question_upvotes (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  created_at TIMESTAMP NOT NULL,
  UNIQUE(question_id, user_id) -- Prevent duplicate upvotes
);

-- Create tables for surveys
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL, -- 'multiple_choice', 'rating', 'text'
  question_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS survey_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  option_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS survey_submissions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES survey_submissions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES survey_options(id) ON DELETE CASCADE,
  rating_value INTEGER,
  text_value TEXT,
  CONSTRAINT valid_response CHECK (
    (option_id IS NOT NULL) OR
    (rating_value IS NOT NULL) OR
    (text_value IS NOT NULL)
  )
);

-- Create tables for analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'interaction', 'submission', etc.
  user_id TEXT NOT NULL, -- Anonymous ID for tracking unique users
  activity_type TEXT NOT NULL, -- 'poll', 'word_cloud', 'quiz', 'qa', 'survey'
  activity_id INTEGER NOT NULL,
  data JSONB, -- Additional event data
  created_at TIMESTAMP NOT NULL
);

-- Create tables for presentations
CREATE TABLE IF NOT EXISTS presentations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presentation_activities (
  id SERIAL PRIMARY KEY,
  presentation_id INTEGER NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'poll', 'quiz', 'qa', 'wordcloud', 'survey'
  activity_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(presentation_id, order_index)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_polls_session_id ON polls(session_id);
CREATE INDEX IF NOT EXISTS idx_word_clouds_session_id ON word_clouds(session_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_session_id ON quizzes(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_session_id ON qa_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_surveys_session_id ON surveys(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_qa_session_id ON questions(qa_session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);