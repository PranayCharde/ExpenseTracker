import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Auth Profile
    await updateProfile(user, { displayName });
    
    // Create Firestore User Document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName,
      email,
      currency: 'USD',
      timezone: 'GMT-5',
      darkMode: false,
      emailAlerts: true,
      createdAt: new Date()
    }, { merge: true });

    return user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const googleLogin = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document for Google users
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        currency: 'USD',
        timezone: 'GMT-5',
        darkMode: false,
        emailAlerts: true,
        createdAt: new Date()
      });
    }
    
    return user;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    signup,
    login,
    googleLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
