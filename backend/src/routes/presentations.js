const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mockDataService = require('../services/mockDataService');
const firestoreService = require('../services/firestoreService');

// Select appropriate data service
const getDataService = () => {
  if (global.useMockData) {
    return mockDataService;
  }
  return firestoreService;
};

// Apply auth middleware
router.use(auth);

// Get all presentations
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'dev-user';
    console.log('Fetching all presentations for user ID:', userId);
    
    const dataService = getDataService();
    const presentations = await dataService.getPresentations(userId);
    
    // Always return with a data property for consistency
    return res.json({ data: presentations });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    
    // If database connection error, switch to mock data
    if (error.code === '3D000' || error.code === '28P01' || error.code === 'ECONNREFUSED') {
      console.log('Database error detected, switching to mock data for future requests');
      global.useMockData = true;
      
      // Try again with mock data
      try {
        const userId = req.user?.id || 'dev-user';
        const presentations = await mockDataService.getPresentations(userId);
        return res.json({ data: presentations });
      } catch (mockError) {
        console.error('Error fetching presentations with mock data:', mockError);
        return res.status(500).json({ error: 'Failed to fetch presentations with mock data' });
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
});

// Get a specific presentation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log(`Invalid presentation ID: ${id}`);
      return res.status(400).json({ 
        error: 'Invalid presentation ID',
        data: null 
      });
    }
    
    console.log(`Fetching presentation ${id}`);
    
    const dataService = getDataService();
    const presentation = await dataService.getPresentation(id);
    
    if (!presentation) {
      return res.status(404).json({ 
        error: 'Presentation not found',
        data: null
      });
    }
    
    return res.json({ data: presentation });
  } catch (error) {
    console.error(`Error fetching presentation ${req.params.id}:`, error);
    
    // If database connection error, switch to mock data
    if (error.code === '3D000' || error.code === '28P01' || error.code === 'ECONNREFUSED') {
      console.log('Database error detected, switching to mock data for this request');
      global.useMockData = true;
      
      // Try again with mock data
      try {
        const { id } = req.params;
        
        // Validate ID parameter again
        if (!id || id === 'undefined' || id === 'null') {
          return res.status(400).json({ 
            error: 'Invalid presentation ID',
            data: null 
          });
        }
        
        const presentation = await mockDataService.getPresentation(id);
        
        if (!presentation) {
          return res.status(404).json({ 
            error: 'Presentation not found',
            data: null
          });
        }
        
        return res.json({ data: presentation });
      } catch (mockError) {
        console.error('Error fetching presentation with mock data:', mockError);
        return res.status(500).json({ 
          error: 'Failed to fetch presentation with mock data',
          data: null
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch presentation',
      data: null
    });
  }
});

// Create a new presentation
router.post('/', async (req, res) => {
  try {
    const { title, description, activities } = req.body;
    const userId = req.user?.id || 'dev-user';
    
    // Input validation
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const dataService = getDataService();
    const presentationId = await dataService.createPresentation({
      title,
      description,
      activities,
      createdBy: userId
    });
    
    return res.status(201).json({
      message: 'Presentation created successfully',
      id: presentationId
    });
  } catch (error) {
    console.error('Error creating presentation:', error);
    
    // If database connection error, switch to mock data
    if (error.code === '3D000' || error.code === '28P01' || error.code === 'ECONNREFUSED') {
      console.log('Database error detected, switching to mock data for this request');
      global.useMockData = true;
      
      // Try again with mock data
      try {
        const { title, description, activities } = req.body;
        const userId = req.user?.id || 'dev-user';
        
        const presentationId = await mockDataService.createPresentation({
          title,
          description,
          activities,
          createdBy: userId
        });
        
        return res.status(201).json({
          message: 'Presentation created successfully (mock data)',
          id: presentationId
        });
      } catch (mockError) {
        console.error('Error creating presentation with mock data:', mockError);
        return res.status(500).json({ error: 'Failed to create presentation with mock data' });
      }
    }
    
    res.status(500).json({ error: 'Failed to create presentation' });
  }
});

// Update a presentation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, activities } = req.body;
    
    const dataService = getDataService();
    const updatedPresentation = await dataService.updatePresentation(id, {
      title,
      description,
      activities
    });
    
    if (!updatedPresentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    
    return res.json({
      message: 'Presentation updated successfully',
      data: updatedPresentation
    });
  } catch (error) {
    console.error(`Error updating presentation ${req.params.id}:`, error);
    
    // If database connection error, switch to mock data
    if (error.code === '3D000' || error.code === '28P01' || error.code === 'ECONNREFUSED') {
      console.log('Database error detected, switching to mock data for this request');
      global.useMockData = true;
      
      // Try again with mock data
      try {
        const { id } = req.params;
        const { title, description, activities } = req.body;
        
        const updatedPresentation = await mockDataService.updatePresentation(id, {
          title,
          description,
          activities
        });
        
        if (!updatedPresentation) {
          return res.status(404).json({ error: 'Presentation not found' });
        }
        
        return res.json({
          message: 'Presentation updated successfully (mock data)',
          data: updatedPresentation
        });
      } catch (mockError) {
        console.error('Error updating presentation with mock data:', mockError);
        return res.status(500).json({ error: 'Failed to update presentation with mock data' });
      }
    }
    
    res.status(500).json({ error: 'Failed to update presentation' });
  }
});

// Delete a presentation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const dataService = getDataService();
    const result = await dataService.deletePresentation(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    
    return res.json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error(`Error deleting presentation ${req.params.id}:`, error);
    
    // If database connection error, switch to mock data
    if (error.code === '3D000' || error.code === '28P01' || error.code === 'ECONNREFUSED') {
      console.log('Database error detected, switching to mock data for this request');
      global.useMockData = true;
      
      // Try again with mock data
      try {
        const { id } = req.params;
        const result = await mockDataService.deletePresentation(id);
        
        if (!result) {
          return res.status(404).json({ error: 'Presentation not found' });
        }
        
        return res.json({ message: 'Presentation deleted successfully (mock data)' });
      } catch (mockError) {
        console.error('Error deleting presentation with mock data:', mockError);
        return res.status(500).json({ error: 'Failed to delete presentation with mock data' });
      }
    }
    
    res.status(500).json({ error: 'Failed to delete presentation' });
  }
});

module.exports = router;