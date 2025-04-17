import React, { useState } from 'react';
import { Box, TextField, Typography, IconButton, Button, List, ListItem, ListItemText, ListItemSecondaryAction, FormControlLabel, Switch, Radio, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChartTypeSelector from '../../../components/activities/ChartTypeSelector';
import ColorSchemeSelector from '../../../components/activities/ColorSchemeSelector';
import AnimationControls from '../../../components/activities/AnimationControls';

/**
 * QuizEditor - Interactive editor for Quiz activities
 * @param {object} props
 *   activity: full quiz activity object
 *   onChange: function(updatedActivity)
 *   mode: 'edit' or 'view'
 */
const QuizEditor = ({ activity, onChange, mode }) => {
  const { question = '', options = [], correctIndex = 0, id, type } = activity;
  const [showPreview, setShowPreview] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleQuestionChange = (e) => {
    onChange({ ...activity, id, type, question: e.target.value });
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = options.slice();
    newOptions[idx] = value;
    onChange({ ...activity, id, type, options: newOptions });
  };

  const handleAddOption = () => {
    onChange({ ...activity, id, type, options: [...options, ''] });
  };

  const handleDeleteOption = (idx) => {
    const newOptions = options.filter((_, i) => i !== idx);
    onChange({ ...activity, id, type, options: newOptions });
  };

  const handleCorrectIndexChange = (idx) => {
    onChange({ ...activity, id, type, correctIndex: idx });
  };

  const handleActivityUpdate = (updatedActivity) => {
    onChange(updatedActivity);
  };

  // --- Preview logic ---
  const handlePreviewSelect = idx => {
    setSelected(idx);
    setFeedback(idx === correctIndex ? 'Correct!' : 'Incorrect');
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Quiz Question</Typography>
      <TextField
        fullWidth
        value={question}
        onChange={handleQuestionChange}
        placeholder="Enter quiz question..."
        sx={{ mb: 2 }}
      />
      <Typography variant="subtitle1">Options</Typography>
      <List>
        {options.map((opt, idx) => (
          <ListItem key={idx}>
            <ListItemText>
              <TextField
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                fullWidth
              />
            </ListItemText>
            <ListItemSecondaryAction>
              <Button
                variant={correctIndex === idx ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => handleCorrectIndexChange(idx)}
                size="small"
                sx={{ mr: 1 }}
              >
                Correct
              </Button>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteOption(idx)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAddOption} sx={{ mt: 1 }} variant="outlined">
        Add Option
      </Button>
      {mode === 'edit' && (
        <>
          <ChartTypeSelector
            selectedType={activity.chartType || 'bar'}
            onChange={(type) => handleActivityUpdate({ ...activity, chartType: type })}
          />
          <ColorSchemeSelector
            selectedScheme={activity.colorScheme || 'default'}
            onChange={(scheme) => handleActivityUpdate({ ...activity, colorScheme: scheme })}
          />
          <AnimationControls
            animation={activity.animation || { duration: 1000, easing: 'easeOutQuad', delay: 0 }}
            onChange={(anim) => handleActivityUpdate({ ...activity, animation: anim })}
          />
        </>
      )}
      <FormControlLabel
        control={<Switch checked={showPreview} onChange={() => setShowPreview(v => !v)} />}
        label="Show Preview"
        sx={{ mt: 3 }}
      />
      {showPreview && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Live Preview</Typography>
          <Paper sx={{ p: 2, mt: 1, bgcolor: '#f6f9ff' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{question || 'Your quiz question will appear here.'}</Typography>
            <List>
              {options.map((opt, idx) => (
                <ListItem key={idx} button onClick={() => handlePreviewSelect(idx)}>
                  <Radio checked={selected === idx} />
                  <ListItemText primary={opt || `Option ${idx + 1}`} />
                </ListItem>
              ))}
            </List>
            {feedback && (
              <Typography sx={{ mt: 2 }} color={feedback === 'Correct!' ? 'success.main' : 'error.main'}>
                {feedback}
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default QuizEditor;
