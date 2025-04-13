/**
 * Seed script for initializing Firestore with mock data
 * Run with: node backend/src/scripts/seed-firestore.js
 */
require('dotenv').config();
const { db, isInitialized } = require('../config/firebase');
const mockDataService = require('../services/mockDataService');

async function seedFirestore() {
  // Check if Firebase is initialized
  if (!isInitialized) {
    console.error('Firebase is not initialized. Please check your credentials.');
    process.exit(1);
  }

  console.log('Starting Firestore data seeding...');

  try {
    // Get all mock presentations
    const presentations = mockDataService.getPresentations();
    console.log(`Found ${presentations.length} presentations to seed.`);

    // Create Firestore batch for atomic operations
    const batch = db.batch();
    const createdDocs = [];

    for (const presentation of presentations) {
      // Create a new presentation document
      console.log(`Processing presentation: ${presentation.title}`);
      
      const presentationRef = db.collection('presentations').doc();
      createdDocs.push({ id: presentationRef.id, title: presentation.title });
      
      // Set presentation data
      batch.set(presentationRef, {
        title: presentation.title,
        description: presentation.description,
        createdAt: presentation.createdAt || new Date().toISOString(),
        updatedAt: presentation.updatedAt || new Date().toISOString(),
        createdBy: 'dev-user',
        hasActivities: Array.isArray(presentation.activities) && presentation.activities.length > 0
      });

      // Add activities if they exist
      if (presentation.activities && presentation.activities.length > 0) {
        console.log(`Adding ${presentation.activities.length} activities for presentation: ${presentation.title}`);
        
        presentation.activities.forEach((activity, index) => {
          const activityRef = db.collection('presentations')
            .doc(presentationRef.id)
            .collection('activities')
            .doc();
          
          // Set activity data
          batch.set(activityRef, {
            type: activity.type,
            title: activity.title || `Activity ${index + 1}`,
            question: activity.question || '',
            options: activity.options || [],
            questions: activity.questions || [],
            maxSubmissions: activity.maxSubmissions || 3,
            isModerated: activity.isModerated || false,
            orderIndex: index,
            createdAt: activity.createdAt || new Date().toISOString(),
            updatedAt: activity.updatedAt || new Date().toISOString(),
            responses: activity.responses || []
          });
        });
      }
    }

    // Commit all changes in a batch
    await batch.commit();
    console.log('Firestore data seeding completed successfully.');
    console.log('Created presentations:');
    createdDocs.forEach(doc => {
      console.log(`- ID: ${doc.id}, Title: ${doc.title}`);
    });

  } catch (error) {
    console.error('Error seeding Firestore data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedFirestore(); 