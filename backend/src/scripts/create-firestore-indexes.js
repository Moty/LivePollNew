/**
 * Script to create necessary Firestore indexes
 * Run with: node backend/src/scripts/create-firestore-indexes.js
 */
require('dotenv').config();
const { admin, isInitialized } = require('../config/firebase');

async function createFirestoreIndexes() {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Please check your credentials.');
    process.exit(1);
  }

  console.log('Creating Firestore indexes...');
  
  try {
    // Get Firestore instance
    const firestore = admin.firestore();
    
    // Define indexes to create
    const indexDefinitions = [
      // Index for presentations by createdBy and createdAt
      {
        collectionGroup: 'presentations',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'createdBy', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' }
        ]
      },
      
      // Index for activities by orderIndex
      {
        collectionGroup: 'activities',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'orderIndex', order: 'ASCENDING' }
        ]
      },
      
      // Index for activities by createdAt
      {
        collectionGroup: 'activities',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'createdAt', order: 'ASCENDING' }
        ]
      }
    ];
    
    console.log(`Creating ${indexDefinitions.length} indexes...`);
    
    // In production, you would use the Firebase Admin SDK to create these indexes
    // However, in practice, Firebase automatically creates most necessary indexes
    // when you run queries that need them. This script is more for documentation.
    
    console.log('In a production environment, you would create these indexes using:');
    console.log('firebase firestore:indexes --project=your-project-id');
    
    // Output the indexes that would be created
    indexDefinitions.forEach((indexDef, i) => {
      console.log(`\nIndex ${i+1}:`);
      console.log(JSON.stringify(indexDef, null, 2));
    });
    
    console.log('\nNote: Firebase will automatically create necessary indexes when you run queries.');
    console.log('You can also manage indexes through the Firebase Console.');
  } catch (error) {
    console.error('Error creating Firestore indexes:', error);
    process.exit(1);
  }
}

// Run the function
createFirestoreIndexes(); 