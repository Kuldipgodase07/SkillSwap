import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCCzc0h34swky5UOuVhQuQCGFHl5xK8kus",
  authDomain: "skill-swap-1564d.firebaseapp.com",
  projectId: "skill-swap-1564d",
  storageBucket: "skill-swap-1564d.firebasestorage.app",
  messagingSenderId: "1030608868233",
  appId: "1:1030608868233:web:caadaeba2a5623a0678758"
};

// Debug: Log the actual values being used
console.log('🔍 Firebase Config Debug:');
console.log('API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Not set');
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Not set');
console.log('Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Not set');
console.log('Storage Bucket:', firebaseConfig.storageBucket ? '✅ Set' : '❌ Not set');
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Not set');
console.log('App ID:', firebaseConfig.appId ? '✅ Set' : '❌ Not set');

console.log('✅ Firebase configuration loaded successfully!');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 