/**
 * firestoreService.js
 * Provides Firestore database operations for the application
 */
const { db, isInitialized } = require('../config/firebase');
const mockDataService = require('./mockDataService');

// Collection names
const COLLECTIONS = {
  PRESENTATIONS: 'presentations',
  POLLS: 'polls',
  QUIZZES: 'quizzes',
  WORDCLOUDS: 'wordclouds',
  QAS: 'qas'
};

// Check if we should use Firestore or mock data
const shouldUseFirestore = () => {
  return isInitialized && !global.useMockData;
};

// Helper functions to standardize responses
const docToObject = (doc) => {
  if (!doc.exists) return null;
  return {
    _id: doc.id,
    ...doc.data()
  };
};

const docsToArray = (snapshot) => {
  const results = [];
  snapshot.forEach(doc => {
    results.push({
      _id: doc.id,
      ...doc.data()
    });
  });
  return results;
};

// Presentation operations
const getPresentations = async (userId) => {
  if (!shouldUseFirestore()) {
    console.log('Using mock data: Fetching all presentations');
    return mockDataService.getPresentations(userId);
  }

  try {
    console.log('Fetching presentations from Firestore');
    let query = db.collection(COLLECTIONS.PRESENTATIONS);
    
    if (userId) {
      query = query.where('createdBy', '==', userId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return docsToArray(snapshot);
  } catch (error) {
    console.error('Error fetching presentations from Firestore:', error);
    // Fallback to mock data
    global.useMockData = true;
    return mockDataService.getPresentations(userId);
  }
};

const getPresentation = async (id) => {
  if (!shouldUseFirestore()) {
    console.log(`Using mock data: Fetching presentation ${id}`);
    return mockDataService.getPresentation(id);
  }

  try {
    console.log(`Fetching presentation ${id} from Firestore`);
    const doc = await db.collection(COLLECTIONS.PRESENTATIONS).doc(id).get();
    const presentation = docToObject(doc);
    
    if (!presentation) {
      console.log(`Presentation ${id} not found in Firestore`);
      return null;
    }
    
    // Get activities if they exist
    if (presentation.hasActivities) {
      const activitiesSnapshot = await db.collection(COLLECTIONS.PRESENTATIONS)
        .doc(id)
        .collection('activities')
        .orderBy('createdAt', 'asc')
        .get();
      
      presentation.activities = docsToArray(activitiesSnapshot);
    } else {
      presentation.activities = [];
    }
    
    return presentation;
  } catch (error) {
    console.error(`Error fetching presentation ${id} from Firestore:`, error);
    // Fallback to mock data
    global.useMockData = true;
    return mockDataService.getPresentation(id);
  }
};

const createPresentation = async (data) => {
  if (!shouldUseFirestore()) {
    console.log('Using mock data: Creating new presentation');
    return mockDataService.createPresentation(data);
  }

  try {
    const now = new Date().toISOString();
    const presentationData = {
      title: data.title || 'Untitled Presentation',
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || 'dev-user',
      hasActivities: Array.isArray(data.activities) && data.activities.length > 0
    };
    
    // Create presentation document
    const docRef = await db.collection(COLLECTIONS.PRESENTATIONS).add(presentationData);
    
    // Add activities if they exist
    if (data.activities && data.activities.length > 0) {
      const activities = data.activities.map((activity, index) => {
        return {
          ...activity, // preserve all custom config fields
          type: activity.type || 'poll',
          title: activity.title || `Activity ${index + 1}`,
          orderIndex: index,
          createdAt: now,
          updatedAt: now,
          responses: activity.responses || []
        };
      });
      
      // Create a batch for adding multiple activities
      const batch = db.batch();
      activities.forEach((activity) => {
        const activityRef = db.collection(COLLECTIONS.PRESENTATIONS)
          .doc(docRef.id)
          .collection('activities')
          .doc();
        batch.set(activityRef, activity);
      });
      
      await batch.commit();
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating presentation in Firestore:', error);
    // Fallback to mock data
    global.useMockData = true;
    return mockDataService.createPresentation(data);
  }
};

const updatePresentation = async (id, data) => {
  if (!shouldUseFirestore()) {
    console.log(`Using mock data: Updating presentation ${id}`);
    return mockDataService.updatePresentation(id, data);
  }

  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // Remove activities from the main document update
    if (updateData.activities) delete updateData.activities;
    
    // Update presentation document
    await db.collection(COLLECTIONS.PRESENTATIONS).doc(id).update(updateData);
    
    // Update activities if they exist
    if (data.activities && data.activities.length > 0) {
      // First, delete existing activities
      const activitiesSnapshot = await db.collection(COLLECTIONS.PRESENTATIONS)
        .doc(id)
        .collection('activities')
        .get();
      
      const batch = db.batch();
      activitiesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Then, add new activities
      data.activities.forEach((activity, index) => {
        const activityRef = db.collection(COLLECTIONS.PRESENTATIONS)
          .doc(id)
          .collection('activities')
          .doc();
        
        batch.set(activityRef, {
          ...activity, // preserve all custom config fields
          type: activity.type || 'poll',
          title: activity.title || `Activity ${index + 1}`,
          orderIndex: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: activity.responses || []
        });
      });
      
      await batch.commit();
      
      // Update hasActivities flag
      await db.collection(COLLECTIONS.PRESENTATIONS)
        .doc(id)
        .update({ hasActivities: true });
    }
    
    // Return the updated presentation
    return await getPresentation(id);
  } catch (error) {
    console.error(`Error updating presentation ${id} in Firestore:`, error);
    // Fallback to mock data
    global.useMockData = true;
    return mockDataService.updatePresentation(id, data);
  }
};

const deletePresentation = async (id) => {
  if (!shouldUseFirestore()) {
    console.log(`Using mock data: Deleting presentation ${id}`);
    return mockDataService.deletePresentation(id);
  }

  try {
    // Delete activities first
    const activitiesSnapshot = await db.collection(COLLECTIONS.PRESENTATIONS)
      .doc(id)
      .collection('activities')
      .get();
    
    const batch = db.batch();
    activitiesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the presentation document
    batch.delete(db.collection(COLLECTIONS.PRESENTATIONS).doc(id));
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error deleting presentation ${id} from Firestore:`, error);
    // Fallback to mock data
    global.useMockData = true;
    return mockDataService.deletePresentation(id);
  }
};

module.exports = {
  getPresentations,
  getPresentation,
  createPresentation,
  updatePresentation,
  deletePresentation
}; 