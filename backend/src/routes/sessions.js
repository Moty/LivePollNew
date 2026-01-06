const express = require('express');
const sessionService = require('../services/sessionService');
const router = express.Router();

/**
 * @route POST /api/presentations/:id/sessions
 * @desc Create a new session for a presentation (presenter mode)
 * @body { sessionCode?: string }
 */
router.post('/presentations/:id/sessions', async (req, res) => {
  try {
    const { id: presentationId } = req.params;
    const { sessionCode } = req.body;

    const session = await sessionService.createSession(presentationId, sessionCode);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/presentations/:id/sessions
 * @desc List sessions for a presentation
 */
router.get('/presentations/:id/sessions', async (req, res) => {
  try {
    const { id: presentationId } = req.params;
    const sessions = await sessionService.listSessions(presentationId);
    res.json(sessions);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/sessions/:sessionId/results
 * @desc Get aggregated poll results for a session. If "Accept: text/csv" exported, returns CSV.
 *        Optional query param pollId to limit to one activity.
 */
router.get('/sessions/:sessionId/results', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pollId } = req.query;

    const results = await sessionService.getPollResults(sessionId, pollId);

    const accept = req.headers['accept'] || '';
    if (accept.includes('text/csv')) {
      // Build CSV string
      const csvRows = ['optionIndex,votes'];
      results.forEach(r => {
        csvRows.push(`${r.optionIndex},${r.votes}`);
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="session_${sessionId}_results.csv"`);
      return res.send(csv);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching session results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
