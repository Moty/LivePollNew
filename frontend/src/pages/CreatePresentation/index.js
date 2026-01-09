import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  Drawer,
  useMediaQuery,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PollEditor from '../EditPresentation/ActivityEditors/PollEditor';
import QuizEditor from '../EditPresentation/ActivityEditors/QuizEditor';
import WordCloudEditor from '../EditPresentation/ActivityEditors/WordCloudEditor';
import QAEditor from '../EditPresentation/ActivityEditors/QAEditor';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

// Activity type defaults - same as EditPresentation
const ACTIVITY_TYPE_DEFAULTS = {
  poll: {
    type: 'poll',
    title: '',
    question: '',
    options: ['', ''],
    multiSelect: false,
    randomize: false
  },
  quiz: {
    type: 'quiz',
    title: '',
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanations: []
  },
  wordcloud: {
    type: 'wordcloud',
    title: '',
    prompt: '',
    maxWords: 3,
    profanityFilter: true,
    colorPalette: 'default'
  },
  qa: {
    type: 'qa',
    title: '',
    prompt: '',
    allowAnonymous: false,
    moderation: false
  }
};

const CreatePresentation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { success, error: showError } = useNotification();

  // Presentation info
  const [formValues, setFormValues] = useState({
    title: '',
    description: ''
  });

  // Activities state
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Responsive sidebar
  const isMobile = useMediaQuery('(max-width:900px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reorder mode
  const [reorderMode, setReorderMode] = useState(false);

  // Add new activity
  const handleAddActivity = () => {
    const newId = Date.now().toString();
    const newActivity = {
      ...ACTIVITY_TYPE_DEFAULTS.poll,
      id: newId,
      title: `Activity ${activities.length + 1}`
    };
    setActivities(prev => [...prev, newActivity]);
    setSelectedActivityId(newId);
    if (isMobile) setSidebarOpen(false);
  };

  // Delete activity
  const handleDeleteActivity = (activityId) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
    if (selectedActivityId === activityId) setSelectedActivityId(null);
  };

  // Duplicate activity
  const handleDuplicateActivity = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const newId = Date.now().toString();
    const duplicated = { ...activity, id: newId, title: (activity.title || 'Activity') + ' (Copy)' };
    setActivities(prev => [...prev, duplicated]);
    setSelectedActivityId(newId);
  };

  // Select activity
  const handleSelectActivity = (activityId) => {
    setSelectedActivityId(activityId);
    if (isMobile) setSidebarOpen(false);
  };

  // Update activity field
  const handleEditField = (field, value) => {
    setActivities(prev => prev.map(a =>
      a.id === selectedActivityId ? { ...a, [field]: value } : a
    ));
  };

  // Update full activity (from editors)
  const handleActivityUpdate = (updatedActivity) => {
    setActivities(prev => prev.map(a =>
      a.id === updatedActivity.id ? { ...a, ...updatedActivity } : a
    ));
  };

  // Move activity up/down
  const moveActivity = (index, direction) => {
    setActivities(prev => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      const [removed] = arr.splice(index, 1);
      arr.splice(newIndex, 0, removed);
      return arr;
    });
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Cancel and go back
  const handleCancel = () => {
    if (activities.length > 0) {
      if (!window.confirm('Are you sure you want to cancel? All your changes will be lost.')) {
        return;
      }
    }
    navigate('/dashboard');
  };

  // Submit presentation
  const handleSubmit = async () => {
    // Validation
    if (!formValues.title?.trim()) {
      showError('Please enter a presentation title');
      return;
    }

    if (activities.length === 0) {
      showError('Please add at least one activity');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format activities for submission
      const formattedActivities = activities.map(({ id, ...activity }) => ({
        ...activity,
        config: {
          question: activity.question,
          options: activity.options,
          correctIndex: activity.correctIndex,
          multiSelect: activity.multiSelect,
          randomize: activity.randomize,
          prompt: activity.prompt,
          maxWords: activity.maxWords,
          profanityFilter: activity.profanityFilter,
          allowAnonymous: activity.allowAnonymous,
          moderation: activity.moderation
        }
      }));

      await apiService.createPresentation({
        ...formValues,
        activities: formattedActivities
      });

      success('Presentation created successfully!');
      navigate('/dashboard', { state: { refresh: true } });
    } catch (err) {
      console.error('Error creating presentation:', err);
      showError(err.response?.data?.error || 'Failed to create presentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected activity
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  // Render activity editor based on type
  const renderActivityEditor = (activity) => {
    if (!activity) return null;
    switch (activity.type) {
      case 'poll':
        return <PollEditor activity={activity} onChange={handleActivityUpdate} mode="edit" />;
      case 'quiz':
        return <QuizEditor activity={activity} onChange={handleActivityUpdate} mode="edit" />;
      case 'wordcloud':
        return <WordCloudEditor activity={activity} onChange={handleActivityUpdate} mode="edit" />;
      case 'qa':
        return <QAEditor activity={activity} onChange={handleActivityUpdate} mode="edit" />;
      default:
        return <Typography color="text.secondary">No editor for type: {activity.type}</Typography>;
    }
  };

  // Sidebar activity list component - memoized to prevent losing focus
  const sidebarContent = React.useMemo(() => (
    <Box sx={{ p: 2, width: isMobile ? 280 : 270 }}>
      {/* Presentation Info */}
      <Typography variant="h6" sx={{ mb: 2 }}>Presentation Info</Typography>
      <TextField
        fullWidth
        label="Title"
        name="title"
        value={formValues.title}
        onChange={handleInputChange}
        placeholder="Enter presentation title"
        sx={{ mb: 2 }}
        required
      />
      <TextField
        fullWidth
        label="Description"
        name="description"
        value={formValues.description}
        onChange={handleInputChange}
        placeholder="Enter description (optional)"
        multiline
        rows={2}
        sx={{ mb: 3 }}
      />

      <Divider sx={{ mb: 2 }} />

      {/* Activities Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Activities ({activities.length})
        </Typography>
        <IconButton
          onClick={() => setReorderMode(r => !r)}
          size="small"
          title="Reorder activities"
        >
          <MenuIcon color={reorderMode ? 'primary' : 'inherit'} />
        </IconButton>
        <IconButton onClick={handleAddActivity} size="small" title="Add activity">
          <AddIcon />
        </IconButton>
      </Box>

      {activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            No activities yet
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddActivity}
          >
            Add First Activity
          </Button>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {activities.map((activity, idx) => (
            <ListItemButton
              key={activity.id}
              selected={activity.id === selectedActivityId}
              onClick={() => {
                if (!reorderMode) handleSelectActivity(activity.id);
              }}
              sx={activity.id === selectedActivityId ? { bgcolor: 'primary.light' } : {}}
            >
              <ListItemText
                primary={activity.title || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} ${idx + 1}`}
                secondary={activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              />
              {reorderMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 1 }}>
                  <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); moveActivity(idx, -1); }}
                    disabled={idx === 0}
                  >
                    <span style={{ fontSize: 14, opacity: idx === 0 ? 0.3 : 1 }}>▲</span>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); moveActivity(idx, 1); }}
                    disabled={idx === activities.length - 1}
                  >
                    <span style={{ fontSize: 14, opacity: idx === activities.length - 1 ? 0.3 : 1 }}>▼</span>
                  </IconButton>
                </Box>
              ) : (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={e => { e.stopPropagation(); handleDuplicateActivity(activity.id); }}
                    title="Duplicate"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={e => { e.stopPropagation(); handleDeleteActivity(activity.id); }}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  ), [formValues, handleInputChange, activities, selectedActivityId, reorderMode, handleAddActivity, handleSelectActivity, moveActivity, handleDuplicateActivity, handleDeleteActivity, isMobile]);

  // Header component
  const Header = () => (
    <AppBar position="sticky" color="primary" sx={{ zIndex: 1201 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        {isMobile && (
          <IconButton color="inherit" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Create Presentation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            disabled={isSubmitting || !formValues.title?.trim() || activities.length === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );

  return (
    <Box sx={{ flexGrow: 1, width: '100%', minHeight: '100vh', bgcolor: '#fafbfc' }}>
      <Header />

      <Grid container spacing={0} sx={{
        height: '100%',
        minHeight: 'calc(100vh - 64px)',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        {/* Sidebar */}
        <Grid item xs={12} md="auto" sx={{
          width: { md: 300 },
          minWidth: { md: 300 },
          maxWidth: { md: 300 },
          borderRight: { md: '1px solid #eee' },
          bgcolor: 'white'
        }}>
          {isMobile ? (
            <Drawer
              anchor="left"
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ zIndex: 1300 }}
            >
              {sidebarContent}
            </Drawer>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              {sidebarContent}
            </Box>
          )}
        </Grid>

        {/* Main Content - Activity Editor */}
        <Grid item xs={12} md sx={{
          p: { xs: 2, md: 4 },
          bgcolor: 'transparent',
          minHeight: '100%',
          overflowY: 'auto'
        }}>
          {selectedActivity ? (
            <Paper sx={{ p: { xs: 2, md: 4 }, minHeight: 400, maxWidth: 900 }} elevation={3}>
              <Typography variant="h5" gutterBottom>
                Edit {selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}
              </Typography>

              {/* Activity type selector */}
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="activity-type-label">Activity Type</InputLabel>
                  <Select
                    labelId="activity-type-label"
                    value={selectedActivity.type}
                    label="Activity Type"
                    onChange={e => {
                      const newType = e.target.value;
                      if (newType !== selectedActivity.type) {
                        // Reset fields to default for new type, preserve id and title
                        const defaults = ACTIVITY_TYPE_DEFAULTS[newType];
                        handleActivityUpdate({
                          ...defaults,
                          id: selectedActivity.id,
                          title: selectedActivity.title || ''
                        });
                      }
                    }}
                  >
                    <MenuItem value="poll">Poll</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="wordcloud">Word Cloud</MenuItem>
                    <MenuItem value="qa">Q&A</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Activity title */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Activity Title"
                  value={selectedActivity.title || ''}
                  onChange={e => handleEditField('title', e.target.value)}
                  placeholder="Enter activity title..."
                />
              </Box>

              {/* Activity-specific editor */}
              {renderActivityEditor(selectedActivity)}
            </Paper>
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 400
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {activities.length === 0
                  ? 'Start by adding your first activity'
                  : 'Select an activity to edit'}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {activities.length === 0
                  ? 'Click "Add First Activity" in the sidebar to begin'
                  : 'Click an activity on the left to configure it'}
              </Typography>
              {activities.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddActivity}
                  size="large"
                >
                  Add First Activity
                </Button>
              )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Loading overlay */}
      {isSubmitting && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Creating presentation...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CreatePresentation;
