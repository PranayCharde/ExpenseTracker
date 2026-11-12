import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DEFAULT_SETTINGS = {
  currency: 'INR',
  timezone: 'GMT+5:30',
  darkMode: false,
  emailAlerts: true
};

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docsnap) => {
      if (docsnap.exists()) {
        const data = docsnap.data();
        setSettings({
          currency: data.currency || 'INR',
          timezone: data.timezone || 'GMT+5:30',
          darkMode: data.darkMode || false,
          emailAlerts: data.emailAlerts !== undefined ? data.emailAlerts : true
        });
      }
      setLoadingContext(false);
    }, (err) => {
      console.warn("Settings snapshot listener error:", err);
      setLoadingContext(false);
    });

    return unsubscribe;
  }, [user]);

  // Apply Dark Mode effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <SettingsContext.Provider value={{ settings, loadingContext }}>
      {children}
    </SettingsContext.Provider>
  );
};