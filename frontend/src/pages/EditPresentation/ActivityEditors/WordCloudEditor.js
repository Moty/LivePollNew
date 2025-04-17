import React, { useState } from 'react';
import { Box, TextField, Typography, Switch, FormControlLabel, Paper } from '@mui/material';
import WordCloudShapeSelector from '../../../components/activities/WordCloudShapeSelector';
import ColorSchemeSelector from '../../../components/activities/ColorSchemeSelector';
import AnimationControls from '../../../components/activities/AnimationControls';

/**
 * WordCloudEditor - Interactive editor for WordCloud activities
 * @param {object} props
 *   activity: full word cloud activity object
 *   onChange: function(updatedActivity)
 *   mode: 'edit' or 'view'
 */
const sampleWords = [
  { text: 'Innovation', weight: 10 },
  { text: 'Teamwork', weight: 7 },
  { text: 'Growth', weight: 5 },
  { text: 'Learning', weight: 9 },
  { text: 'Fun', weight: 3 },
  { text: 'Challenge', weight: 6 },
  { text: 'Success', weight: 8 },
  { text: 'Feedback', weight: 4 }
];

const WordCloudEditor = ({ activity, onChange, mode }) => {
  const { prompt = '', id, type } = activity;
  const [showPreview, setShowPreview] = useState(true);

  const handlePromptChange = (e) => {
    // Always preserve id and type
    onChange({ ...activity, id, type, prompt: e.target.value });
  };

  const handleActivityUpdate = (updatedActivity) => {
    onChange(updatedActivity);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Word Cloud Prompt
      </Typography>
      <TextField
        fullWidth
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter prompt for the word cloud..."
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={<Switch checked={showPreview} onChange={() => setShowPreview(v => !v)} />}
        label="Show Preview"
        sx={{ mb: 2 }}
      />
      {mode === 'edit' && (
        <>
          <WordCloudShapeSelector
            selectedShape={activity.shape || 'rectangle'}
            onChange={(shape) => handleActivityUpdate({ ...activity, shape })}
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
      {showPreview && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Live Preview</Typography>
          <Paper sx={{ p: 2, mt: 1, bgcolor: '#f6f9ff', minHeight: 120 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{prompt || 'Your word cloud prompt will appear here.'}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              {sampleWords.map((w, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: `${16 + w.weight * 3}px`,
                    opacity: 0.7 + w.weight * 0.03,
                    fontWeight: 500,
                    color: `hsl(${(w.weight * 35) % 360}, 60%, 40%)`,
                    margin: '0 10px'
                  }}
                >
                  {w.text}
                </span>
              ))}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default WordCloudEditor;
