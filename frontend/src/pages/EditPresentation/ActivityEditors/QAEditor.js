import React, { useState } from 'react';
import { Box, TextField, Typography, Switch, FormControlLabel, Paper, List, ListItem, ListItemText, IconButton, Chip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

/**
 * QAEditor - Interactive editor for Q&A activities
 * @param {object} props
 *   activity: full Q&A activity object
 *   onChange: function(updatedActivity)
 */
const sampleQuestions = [
  { text: 'What is the roadmap for this project?', upvotes: 8, downvotes: 1, anonymous: false },
  { text: 'How do you handle scaling issues?', upvotes: 5, downvotes: 0, anonymous: true },
  { text: 'Can you share best practices?', upvotes: 3, downvotes: 2, anonymous: false }
];

const QAEditor = ({ activity, onChange }) => {
  const { prompt = '', allowAnonymous = false, moderation = false, id, type } = activity;
  const [showPreview, setShowPreview] = useState(true);

  const handlePromptChange = (e) => {
    onChange({ ...activity, id, type, prompt: e.target.value });
  };
  const handleAllowAnonymousChange = (e) => {
    onChange({ ...activity, id, type, allowAnonymous: e.target.checked });
  };
  const handleModerationChange = (e) => {
    onChange({ ...activity, id, type, moderation: e.target.checked });
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Q&amp;A Prompt</Typography>
      <TextField
        fullWidth
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter prompt for Q&amp;A..."
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={<Switch checked={allowAnonymous} onChange={handleAllowAnonymousChange} />}
        label="Allow Anonymous Questions"
      />
      <FormControlLabel
        control={<Switch checked={moderation} onChange={handleModerationChange} />}
        label="Enable Moderation"
      />
      <FormControlLabel
        control={<Switch checked={showPreview} onChange={() => setShowPreview(v => !v)} />}
        label="Show Preview"
        sx={{ mt: 2 }}
      />
      {showPreview && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Live Preview</Typography>
          <Paper sx={{ p: 2, mt: 1, bgcolor: '#f6f9ff' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{prompt || 'Your Q&A prompt will appear here.'}</Typography>
            <List>
              {sampleQuestions.map((q, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={q.text} />
                  {allowAnonymous && q.anonymous && <Chip label="Anonymous" size="small" sx={{ mr: 1 }} />}
                  <IconButton size="small"><ThumbUpIcon fontSize="small" /> <span style={{marginLeft:4}}>{q.upvotes}</span></IconButton>
                  <IconButton size="small"><ThumbDownIcon fontSize="small" /> <span style={{marginLeft:4}}>{q.downvotes}</span></IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
      // Add any visualization/display controls for Q&A here if needed in the future.
      // For now, ensure only edit-mode settings are shown.
    </Box>
  );
};

export default QAEditor;
