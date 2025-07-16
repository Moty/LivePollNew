import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, List, ListItemButton, ListItemText, ListItemSecondaryAction, IconButton, Button, Typography, Divider, Paper, CircularProgress, MenuItem, Select, FormControl, InputLabel, AppBar, Toolbar, Drawer, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import PollEditor from './ActivityEditors/PollEditor';
import QuizEditor from './ActivityEditors/QuizEditor';
import WordCloudEditor from './ActivityEditors/WordCloudEditor';
import QAEditor from './ActivityEditors/QAEditor';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService from '../../services/api';

const EditPresentation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { success, error: showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    title: '',
    description: ''
  });
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  // --- Fetch presentation data ---
  const fetchPresentation = useCallback(async () => {
      try {
        setLoading(true);
        const response = await apiService.getPresentation(id);
        if (!response.data) throw new Error('No data returned from API');
        const data = response.data;
        setFormValues({
          title: data.title || '',
          description: data.description || ''
        });
        setActivities(
          (data.activities || []).map(a => ({
            ...a,
            id: a.id || a._id // always provide id for frontend logic
          }))
        );
        setLoading(false);
      } catch (err) {
        showError('Failed to fetch presentation: ' + (err.message || 'Unknown error'));
        navigate('/dashboard');
      }
    }, [id, navigate, showError]);

  useEffect(() => {
    if (id) fetchPresentation(); else navigate('/dashboard');
  }, [id, fetchPresentation, navigate]);

  // Add Activity
  const handleAddActivity = () => {
    const newId = Date.now().toString();
    const newActivity = {
      id: newId,
      type: 'poll',
      title: '',
      config: {},
      mode: 'edit',
    };
    setActivities(prev => [...prev, newActivity]);
    setSelectedActivityId(newId);
  };

  // Delete Activity
  const handleDeleteActivity = (activityId) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
    if (selectedActivityId === activityId) setSelectedActivityId(null);
  };

  // Duplicate Activity
  const handleDuplicateActivity = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const newId = Date.now().toString();
    const duplicated = { ...activity, id: newId, title: activity.title + ' (Copy)' };
    setActivities(prev => [...prev, duplicated]);
    setSelectedActivityId(newId);
  };

  // Select Activity
  const handleSelectActivity = (activityId) => {
    setSelectedActivityId(activityId);
  };

  // Auto-save on edit (stub for now)
  const handleEditField = (field, value) => {
    setActivities(prev => prev.map(a =>
      a.id === selectedActivityId ? { ...a, [field]: value } : a
    ));
  };

  // Update activity in state (auto-save)
  const handleActivityUpdate = (updatedActivity) => {
    setActivities(prev => prev.map(a =>
      a.id === updatedActivity.id ? { ...a, ...updatedActivity } : a
    ));
  };

  // --- Persist activities (pages) order and titles to backend on any activities change ---
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef(null);
  const lastSavedActivities = useRef([]);

  // Helper to transform activities for server
  const toServerActivities = acts => acts.map(({ id, _id, ...rest }) => ({ _id: _id || id, ...rest }));

  // Save activities to backend (debounced)
  useEffect(() => {
    if (activities.length === 0 || loading) return;
    // Only save if activities actually changed (deep compare by JSON)
    if (JSON.stringify(activities) === JSON.stringify(lastSavedActivities.current)) return;
    setSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await apiService.updatePresentation(id, {
          ...formValues,
          activities: activities.map(({ id, _id, ...rest }) => ({ _id: _id || id, ...rest })),
        });
        lastSavedActivities.current = JSON.parse(JSON.stringify(activities));
        setSaving(false);
      } catch (err) {
        setSaving(false);
        showError('Failed to save page changes: ' + (err.message || 'Unknown error'));
      }
    }, 700); // Debounce 700ms
    // Cleanup
    return () => saveTimeout.current && clearTimeout(saveTimeout.current);
  }, [activities, formValues, id, loading, showError]);

  // --- Responsive/collapsible sidebar state ---
  const isMobile = useMediaQuery('(max-width:900px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Reorder mode state ---
  const [reorderMode, setReorderMode] = useState(false);

  // --- Move activity up/down handlers ---
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

  // --- Sticky header/footer ---
  const handleSavePresentation = async () => {
    try {
      setSaving(true);
      await apiService.updatePresentation(id, {
        ...formValues,
        activities: activities.map(({ id: aId, _id, ...rest }) => ({ _id: _id || aId, ...rest })),
      });
      lastSavedActivities.current = JSON.parse(JSON.stringify(activities));
      setSaving(false);
      success('Presentation saved');
    } catch (err) {
      setSaving(false);
      showError('Failed to save presentation: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCancelChanges = () => {
    if (loading) return;
    fetchPresentation();
  };

  const Header = () => (
    <AppBar position="sticky" color="primary" sx={{ zIndex: 1201 }}>
      <Toolbar>
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Edit Presentation
        </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleCancelChanges} disabled={loading || saving}>
          Cancel
        </Button>
        <Button variant="contained" color="secondary" onClick={handleSavePresentation} disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      </Toolbar>
    </AppBar>
  );
  const Footer = () => (
    <AppBar position="fixed" color="default" sx={{ top: 'auto', bottom: 0 }}>
      <Toolbar>
        <Typography sx={{ flexGrow: 1, textAlign: 'center', fontSize: 14 }}>
          {new Date().getFullYear()} NewLearnLive
        </Typography>
      </Toolbar>
    </AppBar>
  );

  // --- Activity editor selection ---
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

  // Get selected activity
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  // Supported activity types and their default fields
  const ACTIVITY_TYPE_DEFAULTS = {
    poll: {
      type: 'poll',
      question: '',
      options: ['', ''],
      multiSelect: false,
      randomize: false
    },
    quiz: {
      type: 'quiz',
      question: '',
      options: ['', ''],
      correctIndex: 0,
      explanations: []
    },
    wordcloud: {
      type: 'wordcloud',
      prompt: '',
      maxWords: 3,
      profanityFilter: true,
      colorPalette: 'default'
    },
    qa: {
      type: 'qa',
      prompt: '',
      allowAnonymous: false,
      moderation: false
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 0, sm: 2, md: 4 }, width: '100%', minHeight: '100vh', bgcolor: '#fafbfc', pb: 8 }}>
      <Header />
      <Grid container spacing={0} sx={{
        height: '100%',
        minHeight: '100vh',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
        justifyContent: 'stretch',
      }}>
        {/* Sidebar */}
        <Grid item xs={12} md={'auto'} sx={{ width: { md: 270 }, minWidth: { md: 270 }, maxWidth: { md: 270 }, p: 0, borderRight: { md: '1px solid #eee' }, bgcolor: 'white', zIndex: 2 }}>
          {isMobile ? (
            <Drawer
              anchor="left"
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ zIndex: 1300 }}
            >
              <Box sx={{ width: 270, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                  <Typography variant="h6" sx={{ flex: 1, textAlign: 'left' }}>Pages</Typography>
                  <IconButton onClick={() => setReorderMode(r => !r)} size="small" aria-label="reorder pages">
                    <MenuIcon color={reorderMode ? 'primary' : 'inherit'} />
                  </IconButton>
                  <IconButton onClick={handleAddActivity} size="small" aria-label="add page">
                    <AddIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <SidebarActivityList
                  activities={activities}
                  selectedActivityId={selectedActivityId}
                  handleSelectActivity={id => { setSidebarOpen(false); handleSelectActivity(id); }}
                  handleDuplicateActivity={handleDuplicateActivity}
                  handleDeleteActivity={handleDeleteActivity}
                  reorderMode={reorderMode}
                  moveActivity={moveActivity}
                />
              </Box>
            </Drawer>
          ) : (
            <Box sx={{
              minHeight: { md: '100vh' },
              p: { md: 2 },
              width: 270,
              bgcolor: 'white',
              display: { xs: 'none', md: 'block' },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                <Typography variant="h6" sx={{ flex: 1, textAlign: { md: 'left' } }}>Pages</Typography>
                <IconButton onClick={() => setReorderMode(r => !r)} size="small" aria-label="reorder pages">
                  <MenuIcon color={reorderMode ? 'primary' : 'inherit'} />
                </IconButton>
                <IconButton onClick={handleAddActivity} size="small" aria-label="add page">
                  <AddIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <SidebarActivityList
                activities={activities}
                selectedActivityId={selectedActivityId}
                handleSelectActivity={handleSelectActivity}
                handleDuplicateActivity={handleDuplicateActivity}
                handleDeleteActivity={handleDeleteActivity}
                reorderMode={reorderMode}
                moveActivity={moveActivity}
              />
            </Box>
          )}
        </Grid>

        {/* Main Content - Activity Editor */}
        <Grid item xs={12} md sx={{ p: { xs: 1, md: 4 }, bgcolor: 'transparent', minHeight: '100vh', width: '100%', overflowY: 'auto' }}>
          {saving && (
            <Box sx={{ position: 'absolute', top: 20, right: 40, zIndex: 10, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography color="text.secondary">Saving...</Typography>
            </Box>
          )}
          {selectedActivity !== undefined ? (
            <Paper sx={{ p: { xs: 2, md: 3, lg: 4 }, minHeight: 400, width: '100%', maxWidth: 900 }} elevation={3}>
              <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: 20, md: 28 } }}>
                Edit {selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}
              </Typography>
              {/* Activity type selector */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="activity-type-label">Activity Type</InputLabel>
                  <Select
                    labelId="activity-type-label"
                    value={selectedActivity.type}
                    label="Activity Type"
                    onChange={e => {
                      const newType = e.target.value;
                      if (newType !== selectedActivity.type) {
                        // Warn if changing type on existing activity
                        if (
                          (selectedActivity.question || selectedActivity.prompt || selectedActivity.options) &&
                          !window.confirm('Changing the activity type will reset its fields. Continue?')
                        ) {
                          return;
                        }
                        // Reset fields to default for new type, preserve id and title
                        const defaults = ACTIVITY_TYPE_DEFAULTS[newType];
                        handleActivityUpdate({
                          ...defaults,
                          id: selectedActivity.id,
                          title: selectedActivity.title || '',
                        });
                      }
                    }}
                    sx={{ fontSize: { xs: 14, md: 16 } }}
                  >
                    <MenuItem value="poll">Poll</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="wordcloud">WordCloud</MenuItem>
                    <MenuItem value="qa">Q&amp;A</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {/* Editable title */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Title</Typography>
                <input
                  style={{ width: '100%', fontSize: 18, padding: 8 }}
                  value={selectedActivity.title}
                  onChange={e => handleEditField('title', e.target.value)}
                  placeholder="Activity title..."
                />
              </Box>
              {renderActivityEditor(selectedActivity)}
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a page to preview and edit
              </Typography>
              <Typography color="text.secondary">Click a page on the left, or add a new one.</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
      <Footer />
    </Box>
  );
};

function SidebarActivityList({ activities, selectedActivityId, handleSelectActivity, handleDuplicateActivity, handleDeleteActivity, reorderMode, moveActivity }) {
  return (
    <List sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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
            primary={activity.title || (activity.type.charAt(0).toUpperCase() + activity.type.slice(1))}
            secondary={activity.type}
          />
          {reorderMode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 1 }}>
              <IconButton size="small" onClick={e => { e.stopPropagation(); moveActivity(idx, -1); }} disabled={idx === 0} aria-label="move page up">
                <span style={{ fontSize: 16, opacity: idx === 0 ? 0.3 : 1 }}>▲</span>
              </IconButton>
              <IconButton size="small" onClick={e => { e.stopPropagation(); moveActivity(idx, 1); }} disabled={idx === activities.length - 1} aria-label="move page down">
                <span style={{ fontSize: 16, opacity: idx === activities.length - 1 ? 0.3 : 1 }}>▼</span>
              </IconButton>
            </Box>
          ) : (
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="duplicate page" onClick={e => { e.stopPropagation(); handleDuplicateActivity(activity.id); }} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton edge="end" aria-label="delete page" onClick={e => { e.stopPropagation(); handleDeleteActivity(activity.id); }} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItemButton>
      ))}
    </List>
  );
}

export default EditPresentation;