const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isValidObjectId } = require('../middleware/validation');
const { defaultRateLimit } = require('../middleware/rateLimit');
const sessionStore = require('../services/sessionStore');
const logger = require('../utils/logger');

/**
 * Analytics routes for aggregating and retrieving metrics
 * Uses real session data from the session store
 */

// Apply rate limiting to all analytics endpoints
router.use(defaultRateLimit);

/**
 * Helper to aggregate responses by activity type
 */
const aggregateByActivityType = (responses) => {
  const byType = { poll: 0, quiz: 0, wordcloud: 0, qa: 0 };

  responses.forEach(r => {
    const activityId = r.activityId || '';
    if (activityId.includes('poll')) byType.poll++;
    else if (activityId.includes('quiz')) byType.quiz++;
    else if (activityId.includes('wordcloud') || activityId.includes('word')) byType.wordcloud++;
    else if (activityId.includes('qa') || activityId.includes('qna')) byType.qa++;
  });

  return byType;
};

/**
 * @route   GET /api/analytics/presentation/:id
 * @desc    Get overall analytics for a presentation
 * @access  Private
 */
router.get('/presentation/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid presentation ID'
      });
    }

    // Get real data from session store
    const responses = sessionStore.getPresentationResponses(id);
    const activeSessions = sessionStore.getActiveSessions().filter(
      s => s.presentationId === id
    );

    // Calculate real metrics
    const participantSet = new Set();
    const activitySet = new Set();

    responses.forEach(r => {
      participantSet.add(r.participantId);
      activitySet.add(r.activityId);
    });

    // Add participants from active sessions
    activeSessions.forEach(s => {
      if (s.participants) {
        if (s.participants instanceof Set) {
          s.participants.forEach(p => participantSet.add(p));
        } else if (Array.isArray(s.participants)) {
          s.participants.forEach(p => participantSet.add(p));
        }
      }
    });

    const byType = aggregateByActivityType(responses);
    const totalByType = byType.poll + byType.quiz + byType.wordcloud + byType.qa;

    // Calculate engagement percentages
    const engagementData = totalByType > 0 ? [
      Math.round((byType.poll / totalByType) * 100),
      Math.round((byType.quiz / totalByType) * 100),
      Math.round((byType.wordcloud / totalByType) * 100),
      Math.round((byType.qa / totalByType) * 100)
    ] : [0, 0, 0, 0];

    const analytics = {
      participantCount: participantSet.size,
      activityCount: activitySet.size,
      totalResponses: responses.length,
      activeSessions: activeSessions.length,

      engagementByActivity: {
        labels: ['Polls', 'Quizzes', 'Word Cloud', 'Q&A'],
        datasets: [
          {
            label: 'Response Distribution (%)',
            data: engagementData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
            ]
          },
        ],
      },

      responsesByType: byType,

      // Note: Device distribution requires tracking user-agent in responses
      // This would need to be added to the response collection
      deviceDistribution: {
        labels: ['Unknown'],
        datasets: [{ data: [100], backgroundColor: ['rgba(128, 128, 128, 0.6)'] }],
        note: 'Device tracking not yet implemented'
      },
    };

    res.json(analytics);
  } catch (err) {
    logger.error('Error fetching presentation analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/session/:sessionId
 * @desc    Get analytics for a specific session
 * @access  Private
 */
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = sessionStore.getSessionStats(sessionId);

    if (!stats) {
      return res.status(404).json({
        error: true,
        message: 'Session not found'
      });
    }

    res.json(stats);
  } catch (err) {
    logger.error('Error fetching session analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/poll/:id
 * @desc    Get detailed analytics for a poll
 * @access  Private
 */
router.get('/poll/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid poll ID'
      });
    }

    // Get responses for this poll
    let responses = [];
    if (sessionId) {
      responses = sessionStore.getActivityResponses(sessionId, id);
    } else {
      // Search across all sessions
      for (const session of sessionStore.getActiveSessions()) {
        const activityResponses = (session.responses || []).filter(
          r => r.activityId === id
        );
        responses.push(...activityResponses);
      }
    }

    // Calculate option breakdown
    const optionCounts = {};
    const participantSet = new Set();

    responses.forEach(r => {
      participantSet.add(r.participantId);
      const option = r.responseData?.selectedOption ?? r.responseData;
      if (option !== undefined) {
        optionCounts[option] = (optionCounts[option] || 0) + 1;
      }
    });

    const totalResponses = responses.length;
    const optionBreakdown = Object.entries(optionCounts).map(([option, count]) => ({
      option: `Option ${parseInt(option) + 1}`,
      optionIndex: parseInt(option),
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 1000) / 10 : 0
    }));

    // Calculate time series (group by minute)
    const timeSeries = [];
    if (responses.length > 0) {
      const timeGroups = {};
      responses.forEach(r => {
        if (r.timestamp) {
          const date = new Date(r.timestamp);
          const minute = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          timeGroups[minute] = (timeGroups[minute] || 0) + 1;
        }
      });
      Object.entries(timeGroups).sort().forEach(([time, count]) => {
        timeSeries.push({ time, count });
      });
    }

    const analytics = {
      totalResponses,
      uniqueParticipants: participantSet.size,
      responseRate: participantSet.size > 0 ? Math.round((totalResponses / participantSet.size) * 100) : 0,
      optionBreakdown,
      timeSeries
    };

    res.json(analytics);
  } catch (err) {
    logger.error('Error fetching poll analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/quiz/:id
 * @desc    Get detailed analytics for a quiz
 * @access  Private
 */
router.get('/quiz/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid quiz ID'
      });
    }

    // Get responses for this quiz
    let responses = [];
    if (sessionId) {
      responses = sessionStore.getActivityResponses(sessionId, id);
    } else {
      for (const session of sessionStore.getActiveSessions()) {
        const activityResponses = (session.responses || []).filter(
          r => r.activityId === id
        );
        responses.push(...activityResponses);
      }
    }

    // Calculate score statistics
    const scores = responses
      .map(r => r.responseData?.score)
      .filter(s => typeof s === 'number');

    const participantSet = new Set();
    responses.forEach(r => participantSet.add(r.participantId));

    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Calculate score distribution
    const scoreRanges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0
    };

    scores.forEach(score => {
      if (score <= 20) scoreRanges['0-20%']++;
      else if (score <= 40) scoreRanges['21-40%']++;
      else if (score <= 60) scoreRanges['41-60%']++;
      else if (score <= 80) scoreRanges['61-80%']++;
      else scoreRanges['81-100%']++;
    });

    const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
      range,
      count
    }));

    const analytics = {
      totalParticipants: participantSet.size,
      totalResponses: responses.length,
      averageScore: Math.round(avgScore * 10) / 10,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      scoreDistribution
    };

    res.json(analytics);
  } catch (err) {
    logger.error('Error fetching quiz analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/wordcloud/:id
 * @desc    Get detailed analytics for a word cloud
 * @access  Private
 */
router.get('/wordcloud/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid word cloud ID'
      });
    }

    // Get responses for this word cloud
    let responses = [];
    if (sessionId) {
      responses = sessionStore.getActivityResponses(sessionId, id);
    } else {
      for (const session of sessionStore.getActiveSessions()) {
        const activityResponses = (session.responses || []).filter(
          r => r.activityId === id
        );
        responses.push(...activityResponses);
      }
    }

    // Calculate word frequencies
    const wordCounts = {};
    const participantSet = new Set();

    responses.forEach(r => {
      participantSet.add(r.participantId);
      const word = (r.responseData?.word ?? r.responseData ?? '').toString().toLowerCase().trim();
      if (word) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Sort by frequency and format for word cloud display
    const wordFrequencies = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) // Top 50 words
      .map(([text, value]) => ({ text, value }));

    const analytics = {
      totalSubmissions: responses.length,
      uniqueWords: Object.keys(wordCounts).length,
      participantCount: participantSet.size,
      averageWordsPerParticipant: participantSet.size > 0
        ? Math.round((responses.length / participantSet.size) * 10) / 10
        : 0,
      wordFrequencies
    };

    res.json(analytics);
  } catch (err) {
    logger.error('Error fetching word cloud analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/qa/:id
 * @desc    Get detailed analytics for a Q&A session
 * @access  Private
 */
router.get('/qa/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid Q&A ID'
      });
    }

    // Get responses for this Q&A
    let responses = [];
    if (sessionId) {
      responses = sessionStore.getActivityResponses(sessionId, id);
    } else {
      for (const session of sessionStore.getActiveSessions()) {
        const activityResponses = (session.responses || []).filter(
          r => r.activityId === id
        );
        responses.push(...activityResponses);
      }
    }

    const participantSet = new Set();
    let totalUpvotes = 0;
    let mostUpvoted = { text: '', upvotes: 0 };

    responses.forEach(r => {
      participantSet.add(r.participantId);
      const upvotes = r.responseData?.upvotes ?? 0;
      totalUpvotes += upvotes;

      if (upvotes > mostUpvoted.upvotes) {
        mostUpvoted = {
          text: r.responseData?.question ?? r.responseData ?? '',
          upvotes
        };
      }
    });

    // Count answered vs unanswered
    const answeredQuestions = responses.filter(
      r => r.responseData?.answered === true
    ).length;

    // Calculate time distribution
    const timeGroups = {};
    responses.forEach(r => {
      if (r.timestamp) {
        const date = new Date(r.timestamp);
        const fiveMinBlock = Math.floor(date.getMinutes() / 5) * 5;
        const time = `${fiveMinBlock.toString().padStart(2, '0')}:00`;
        timeGroups[time] = (timeGroups[time] || 0) + 1;
      }
    });

    const timeDistribution = Object.entries(timeGroups)
      .sort()
      .map(([time, count]) => ({ time, count }));

    const analytics = {
      totalQuestions: responses.length,
      answeredQuestions,
      participantCount: participantSet.size,
      averageQuestionsPerParticipant: participantSet.size > 0
        ? Math.round((responses.length / participantSet.size) * 10) / 10
        : 0,
      totalUpvotes,
      mostUpvotedQuestion: mostUpvoted.text ? mostUpvoted : null,
      timeDistribution
    };

    res.json(analytics);
  } catch (err) {
    logger.error('Error fetching Q&A analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/realtime
 * @desc    Get real-time system statistics
 * @access  Private
 */
router.get('/realtime', auth, async (req, res) => {
  try {
    const activeSessions = sessionStore.getActiveSessions();

    let totalParticipants = 0;
    let totalResponses = 0;

    activeSessions.forEach(session => {
      totalParticipants += session.participantCount || 0;
      totalResponses += session.totalResponses || 0;
    });

    res.json({
      activeSessions: activeSessions.length,
      totalParticipants,
      totalResponses,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Error fetching realtime analytics:', err);
    res.status(500).json({
      error: true,
      message: 'Server error while fetching realtime analytics'
    });
  }
});

module.exports = router;
