import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const getInitialDarkMode = () => {
  try {
    const saved = localStorage.getItem('spendwise_darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    // ignore
  }
  return false;
};

const DEFAULT_SETTINGS = {
  currency: 'INR',
  timezone: 'GMT+5:30',
  darkMode: getInitialDarkMode(),
  emailAlerts: true
};

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingContext, setLoadingContext] = useState(() => !user);

  // Apply Dark / Light mode to <html> tag on initial load and whenever darkMode changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Listen to Firestore settings for logged-in user
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docsnap) => {
      if (docsnap.exists()) {
        const data = docsnap.data();
        
        setSettings(prev => {
          const firestoreDarkMode = data.darkMode !== undefined ? data.darkMode : prev.darkMode;
          try {
            localStorage.setItem('spendwise_darkMode', String(firestoreDarkMode));
          } catch {
            // ignore
          }
          return {
            ...prev,
            currency: data.currency || 'INR',
            timezone: data.timezone || 'GMT+5:30',
            darkMode: firestoreDarkMode,
            emailAlerts: data.emailAlerts !== undefined ? data.emailAlerts : true
          };
        });
      }
      setLoadingContext(false);
    }, (err) => {
      console.warn("Settings snapshot listener error:", err);
      setLoadingContext(false);
    });

    return unsubscribe;
  }, [user]);

  // Method to toggle or explicitly set Dark / Light Mode with instant feedback
  const updateDarkMode = async (isDark) => {
    // 1. Instant local state update
    setSettings(prev => ({ ...prev, darkMode: isDark }));

    // 2. Instant DOM update
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Persist to localStorage
    try {
      localStorage.setItem('spendwise_darkMode', String(isDark));
    } catch (e) {
      console.warn("Failed to save theme in localStorage", e);
    }

    // 4. Persist to Firestore if user is authenticated
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          darkMode: isDark
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to persist theme to Firestore", err);
      }
    }
  };

  const toggleDarkMode = () => {
    updateDarkMode(!settings.darkMode);
  };

  return (
    <SettingsContext.Provider value={{ settings, loadingContext, toggleDarkMode, updateDarkMode }}>
      {children}
    </SettingsContext.Provider>
  );
};