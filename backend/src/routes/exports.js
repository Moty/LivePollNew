const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionStore = require('../services/sessionStore');
const { defaultRateLimit } = require('../middleware/rateLimit');
const logger = require('../utils/logger');

/**
 * Export routes for data export functionality
 * Allows downloading response data in CSV and JSON formats
 */

// Apply rate limiting to all export endpoints
router.use(defaultRateLimit);

/**
 * Helper function to escape CSV values
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Helper function to convert array of objects to CSV
 */
const toCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return columns.map(c => c.header).join(',') + '\n';
  }

  const header = columns.map(c => escapeCSV(c.header)).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCSV(c.accessor(row))).join(',')
  );

  return [header, ...rows].join('\n');
};

/**
 * @route   GET /api/export/session/:sessionId
 * @desc    Export all session data as JSON or CSV
 * @access  Private
 */
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const format = req.query.format || 'json';

    const sessionData = sessionStore.exportSessionData(sessionId);

    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (format === 'csv') {
      const columns = [
        { header: 'Activity ID', accessor: r => r.activityId },
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName },
        { header: 'Response', accessor: r => JSON.stringify(r.responseData) },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(sessionData.responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}-export.csv"`);
      return res.send(csv);
    }

    // Default to JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}-export.json"`);
    return res.json(sessionData);
  } catch (err) {
    logger.error('Error exporting session data:', err);
    res.status(500).json({ error: 'Failed to export session data' });
  }
});

/**
 * @route   GET /api/export/activity/:sessionId/:activityId
 * @desc    Export activity responses as CSV or JSON
 * @access  Private
 */
router.get('/activity/:sessionId/:activityId', auth, async (req, res) => {
  try {
    const { sessionId, activityId } = req.params;
    const format = req.query.format || 'json';

    const responses = sessionStore.getActivityResponses(sessionId, activityId);

    if (format === 'csv') {
      const columns = [
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName },
        { header: 'Response', accessor: r => JSON.stringify(r.responseData) },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity-${activityId}-export.csv"`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="activity-${activityId}-export.json"`);
    return res.json({ activityId, responses });
  } catch (err) {
    logger.error('Error exporting activity data:', err);
    res.status(500).json({ error: 'Failed to export activity data' });
  }
});

/**
 * @route   GET /api/export/polls/:id
 * @desc    Export poll results as CSV or JSON
 * @access  Private
 */
router.get('/polls/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'csv';
    const sessionId = req.query.sessionId;

    // Get responses for this poll activity
    let responses = [];
    if (sessionId) {
      responses = sessionStore.getActivityResponses(sessionId, id);
    } else {
      // Try to find responses across all sessions
      for (const session of sessionStore.getActiveSessions()) {
        const activityResponses = (session.responses || []).filter(
          r => r.activityId === id
        );
        responses.push(...activityResponses);
      }
    }

    // Calculate vote counts per option
    const voteCounts = {};
    responses.forEach(r => {
      const option = r.responseData?.selectedOption ?? r.responseData;
      if (option !== undefined) {
        voteCounts[option] = (voteCounts[option] || 0) + 1;
      }
    });

    if (format === 'csv') {
      const columns = [
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName || 'Anonymous' },
        { header: 'Selected Option', accessor: r => r.responseData?.selectedOption ?? r.responseData },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="poll-${id}-results.csv"`);
      return res.send(csv);
    }

    // JSON format
    res.json({
      pollId: id,
      totalResponses: responses.length,
      voteCounts,
      responses: responses.map(r => ({
        participantId: r.participantId,
        userName: r.userName,
        selectedOption: r.responseData?.selectedOption ?? r.responseData,
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    logger.error('Error exporting poll data:', err);
    res.status(500).json({ error: 'Failed to export poll data' });
  }
});

/**
 * @route   GET /api/export/quizzes/:id
 * @desc    Export quiz results as CSV or JSON
 * @access  Private
 */
router.get('/quizzes/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'csv';
    const sessionId = req.query.sessionId;

    // Get responses for this quiz activity
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

    if (format === 'csv') {
      const columns = [
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName || 'Anonymous' },
        { header: 'Answer', accessor: r => JSON.stringify(r.responseData?.answer ?? r.responseData) },
        { header: 'Score', accessor: r => r.responseData?.score ?? '' },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quiz-${id}-results.csv"`);
      return res.send(csv);
    }

    // Calculate score statistics
    const scores = responses
      .map(r => r.responseData?.score)
      .filter(s => typeof s === 'number');

    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    res.json({
      quizId: id,
      totalResponses: responses.length,
      statistics: {
        averageScore: avgScore.toFixed(2),
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0
      },
      responses: responses.map(r => ({
        participantId: r.participantId,
        userName: r.userName,
        answer: r.responseData?.answer ?? r.responseData,
        score: r.responseData?.score,
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    logger.error('Error exporting quiz data:', err);
    res.status(500).json({ error: 'Failed to export quiz data' });
  }
});

/**
 * @route   GET /api/export/wordclouds/:id
 * @desc    Export word cloud data as CSV or JSON
 * @access  Private
 */
router.get('/wordclouds/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'csv';
    const sessionId = req.query.sessionId;

    // Get responses for this word cloud activity
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
    const wordFrequencies = {};
    responses.forEach(r => {
      const word = (r.responseData?.word ?? r.responseData ?? '').toString().toLowerCase().trim();
      if (word) {
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
      }
    });

    // Sort by frequency
    const sortedWords = Object.entries(wordFrequencies)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));

    if (format === 'csv') {
      // Export individual submissions
      const columns = [
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName || 'Anonymous' },
        { header: 'Word', accessor: r => r.responseData?.word ?? r.responseData },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="wordcloud-${id}-submissions.csv"`);
      return res.send(csv);
    }

    res.json({
      wordCloudId: id,
      totalSubmissions: responses.length,
      uniqueWords: Object.keys(wordFrequencies).length,
      wordFrequencies: sortedWords,
      submissions: responses.map(r => ({
        participantId: r.participantId,
        userName: r.userName,
        word: r.responseData?.word ?? r.responseData,
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    logger.error('Error exporting word cloud data:', err);
    res.status(500).json({ error: 'Failed to export word cloud data' });
  }
});

/**
 * @route   GET /api/export/qa/:id
 * @desc    Export Q&A data as CSV or JSON
 * @access  Private
 */
router.get('/qa/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'csv';
    const sessionId = req.query.sessionId;

    // Get responses for this Q&A activity
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

    if (format === 'csv') {
      const columns = [
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName || 'Anonymous' },
        { header: 'Question', accessor: r => r.responseData?.question ?? '' },
        { header: 'Answer', accessor: r => r.responseData?.answer ?? r.responseData },
        { header: 'Upvotes', accessor: r => r.responseData?.upvotes ?? 0 },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="qa-${id}-questions.csv"`);
      return res.send(csv);
    }

    res.json({
      qaId: id,
      totalQuestions: responses.length,
      questions: responses.map(r => ({
        participantId: r.participantId,
        userName: r.userName,
        question: r.responseData?.question,
        answer: r.responseData?.answer ?? r.responseData,
        upvotes: r.responseData?.upvotes ?? 0,
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    logger.error('Error exporting Q&A data:', err);
    res.status(500).json({ error: 'Failed to export Q&A data' });
  }
});

/**
 * @route   GET /api/export/presentation/:presentationId
 * @desc    Export all data for a presentation
 * @access  Private
 */
router.get('/presentation/:presentationId', auth, async (req, res) => {
  try {
    const { presentationId } = req.params;
    const format = req.query.format || 'json';

    const responses = sessionStore.getPresentationResponses(presentationId);

    if (format === 'csv') {
      const columns = [
        { header: 'Session ID', accessor: r => r.sessionId },
        { header: 'Session Code', accessor: r => r.sessionCode },
        { header: 'Activity ID', accessor: r => r.activityId },
        { header: 'Participant ID', accessor: r => r.participantId },
        { header: 'User Name', accessor: r => r.userName || 'Anonymous' },
        { header: 'Response', accessor: r => JSON.stringify(r.responseData) },
        { header: 'Timestamp', accessor: r => r.timestamp }
      ];

      const csv = toCSV(responses, columns);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="presentation-${presentationId}-export.csv"`);
      return res.send(csv);
    }

    // Group by session
    const bySession = {};
    responses.forEach(r => {
      if (!bySession[r.sessionId]) {
        bySession[r.sessionId] = {
          sessionId: r.sessionId,
          sessionCode: r.sessionCode,
          responses: []
        };
      }
      bySession[r.sessionId].responses.push(r);
    });

    res.json({
      presentationId,
      totalResponses: responses.length,
      sessions: Object.values(bySession)
    });
  } catch (err) {
    logger.error('Error exporting presentation data:', err);
    res.status(500).json({ error: 'Failed to export presentation data' });
  }
});

/**
 * @route   GET /api/export/reports/:presentationId
 * @desc    Generate summary report for presentation (JSON only, no PDF)
 * @access  Private
 */
router.get('/reports/:presentationId', auth, async (req, res) => {
  try {
    const { presentationId } = req.params;

    const responses = sessionStore.getPresentationResponses(presentationId);

    // Calculate summary statistics
    const activityStats = {};
    const participantSet = new Set();

    responses.forEach(r => {
      participantSet.add(r.participantId);

      if (!activityStats[r.activityId]) {
        activityStats[r.activityId] = {
          activityId: r.activityId,
          responseCount: 0,
          participants: new Set()
        };
      }
      activityStats[r.activityId].responseCount++;
      activityStats[r.activityId].participants.add(r.participantId);
    });

    // Convert sets to counts
    const activitySummaries = Object.values(activityStats).map(stat => ({
      activityId: stat.activityId,
      responseCount: stat.responseCount,
      uniqueParticipants: stat.participants.size
    }));

    res.json({
      presentationId,
      summary: {
        totalResponses: responses.length,
        totalParticipants: participantSet.size,
        totalActivities: Object.keys(activityStats).length
      },
      activityBreakdown: activitySummaries,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
