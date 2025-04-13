// Firebase and Firestore configuration
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Determine if we're using service account credentials or environment variables
let serviceAccount;
try {
  // Check if there's a service account file
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(__dirname, '../../firebase-credentials.json');
  
  console.log(`Checking for Firebase credentials at: ${serviceAccountPath}`);
  
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
    console.log('Using Firebase service account from file');
  } else {
    // If no file, try to use environment variables
    if (process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      console.log('Using Firebase credentials from environment variables');
    } else {
      console.log('No Firebase credentials found, will operate in mock mode');
    }
  }
} catch (error) {
  console.error('Error loading Firebase credentials:', error);
}

// Initialize Firebase Admin
let db = null;
let firestoreInitialized = false;

try {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    firestoreInitialized = true;
    console.log('Firebase initialized successfully with project:', serviceAccount.projectId);
  } else {
    console.log('Firebase not initialized - missing credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  console.log('Will continue in mock data mode');
}

module.exports = {
  db,
  admin,
  isInitialized: firestoreInitialized
}; 