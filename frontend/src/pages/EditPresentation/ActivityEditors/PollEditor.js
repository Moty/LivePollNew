import React, { useState } from 'react';
import { Box, TextField, Typography, IconButton, Button, List, ListItem, ListItemText, ListItemSecondaryAction, FormControlLabel, Switch, Radio, Checkbox, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChartTypeSelector from '../../../components/activities/ChartTypeSelector';
import ColorSchemeSelector from '../../../components/activities/ColorSchemeSelector';
import AnimationControls from '../../../components/activities/AnimationControls';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

/**
 * PollEditor - Interactive editor for Poll activities (advanced)
 * @param {object} props
 *   activity: full poll activity object
 *   onChange: function(updatedActivity)
 *   mode: 'edit' or 'view'
 */
const PollEditor = ({ activity, onChange, mode }) => {
  const {
    question = '',
    options = [],
    multiSelect = false,
    randomize = false,
    id,
    type,
    chartType = 'bar',
    colorScheme = 'default',
    animation = { duration: 1000, easing: 'easeOutQuad', delay: 0 }
  } = activity;

  // Advanced options handlers
  const handleMultiSelectChange = (e) => {
    onChange({ ...activity, id, type, multiSelect: e.target.checked });
  };

  const handleRandomizeChange = (e) => {
    onChange({ ...activity, id, type, randomize: e.target.checked });
  };

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

  const handleActivityUpdate = (updatedActivity) => {
    onChange(updatedActivity);
  };

  // --- Live Preview State (local, not saved) ---
  const [selected, setSelected] = useState([]);
  // Mock results for preview
  const mockVotes = options.map(() => Math.floor(Math.random() * 20));
  const totalVotes = mockVotes.reduce((a, b) => a + b, 0) || 1;
  const previewOptions = randomize ? [...options].sort(() => Math.random() - 0.5) : options;

  // Chart.js preview data
  const chartData = {
    labels: previewOptions,
    datasets: [
      {
        label: 'Votes',
        data: previewOptions.map((_, idx) => mockVotes[idx] || 0),
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation,
    plugins: {
      legend: { display: chartType === 'pie' || chartType === 'doughnut' },
      tooltip: {
        callbacks: {
          label: context => `${context.raw} votes`,
        },
      },
    },
    indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
  };

  const renderPreviewChart = () => {
    switch (chartType) {
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      case 'horizontalBar':
        return <Bar data={chartData} options={{ ...chartOptions, indexAxis: 'y' }} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  const handlePreviewSelect = idx => {
    if (multiSelect) {
      setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
    } else {
      setSelected([idx]);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Poll Question</Typography>
      <TextField
        fullWidth
        value={question}
        onChange={handleQuestionChange}
        placeholder="Enter poll question..."
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
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2">Advanced Options</Typography>
        <FormControlLabel
          control={<Switch checked={multiSelect} onChange={handleMultiSelectChange} />}
          label="Allow Multiple Selections"
        />
        <FormControlLabel
          control={<Switch checked={randomize} onChange={handleRandomizeChange} />}
          label="Randomize Option Order"
        />
      </Box>
      {mode === 'edit' && (
        <>
          <ChartTypeSelector
            selectedType={chartType}
            onChange={(type) => handleActivityUpdate({ ...activity, chartType: type })}
          />
          <ColorSchemeSelector
            selectedScheme={colorScheme}
            onChange={(scheme) => handleActivityUpdate({ ...activity, colorScheme: scheme })}
          />
          <AnimationControls
            animation={animation}
            onChange={(anim) => handleActivityUpdate({ ...activity, animation: anim })}
          />
        </>
      )}
      {/* --- Live Preview --- */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Live Preview</Typography>
        <Paper sx={{ p: 2, mt: 1, bgcolor: '#f6f9ff' }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>{question || 'Your poll question will appear here.'}</Typography>
          <Box sx={{ width: '100%', minHeight: 200, mb: 2 }}>
            {renderPreviewChart()}
          </Box>
          <List>
            {previewOptions.map((opt, idx) => (
              <ListItem key={idx} button onClick={() => handlePreviewSelect(idx)}>
                {multiSelect ? (
                  <Checkbox checked={selected.includes(idx)} />
                ) : (
                  <Radio checked={selected.includes(idx)} />
                )}
                <ListItemText primary={opt || `Option ${idx + 1}`} />
              </ListItem>
            ))}
          </List>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Results Preview</Typography>
          <Box>
            {previewOptions.map((opt, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ width: 120 }}>{opt || `Option ${idx + 1}`}</Box>
                <Box sx={{ flex: 1, mx: 1, bgcolor: '#1976d2', height: 12, borderRadius: 1, width: `${(mockVotes[idx] / totalVotes) * 100}%` }} />
                <Box sx={{ ml: 1 }}>{mockVotes[idx]} votes</Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PollEditor;
