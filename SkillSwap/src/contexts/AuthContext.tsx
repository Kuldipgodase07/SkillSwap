import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  error: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      console.log('🔍 Fetching user profile for:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('✅ User profile loaded:', userData);
        setUserProfile(userData);
      } else {
        console.log('⚠️ User profile not found, creating new profile');
        setUserProfile(null);
      }
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      setError('Failed to load user profile');
    }
  };

  // Set up admin user if needed
  const setupAdminUser = async (uid: string, email: string) => {
    if (email === 'admin@gmail.com') {
      try {
        console.log('🔧 Setting up admin user...');
        const adminRef = doc(db, 'users', uid);
        const adminDoc = await getDoc(adminRef);
        
        if (!adminDoc.exists()) {
          await setDoc(adminRef, {
            uid: uid,
            email: email,
            displayName: 'Platform Admin',
            photoURL: null,
            bio: 'Platform administrator',
            location: '',
            skillsToTeach: [],
            skillsToLearn: [],
            rating: 0,
            totalRatings: 0,
            role: 'super_admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('✅ Admin user created successfully');
        } else {
          // Update existing user to ensure admin role
          const existingData = adminDoc.data();
          await setDoc(adminRef, {
            ...existingData,
            role: 'super_admin',
            email: email,
            isActive: true,
            updatedAt: new Date()
          });
          console.log('✅ Admin user updated successfully');
        }
        
        // Fetch the updated profile
        await fetchUserProfile(uid);
      } catch (error) {
        console.error('❌ Error setting up admin user:', error);
      }
    }
  };

  useEffect(() => {
    console.log('🔍 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      
      if (user) {
        console.log('🔍 User email:', user.email);
        // Set up admin user if needed
        if (user.email === 'admin@gmail.com') {
          await setupAdminUser(user.uid, user.email);
        } else {
          await fetchUserProfile(user.uid);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 