import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    currency: 'USD',
    timezone: 'GMT-5',
    darkMode: false,
    emailAlerts: true
  });
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (!user) {
      // Reset settings if user logs out
      setSettings({
        currency: 'USD',
        timezone: 'GMT-5',
        darkMode: false,
        emailAlerts: true
      });
      setLoadingContext(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docsnap) => {
      if (docsnap.exists()) {
        const data = docsnap.data();
        setSettings({
          currency: data.currency || 'USD',
          timezone: data.timezone || 'GMT-5',
          darkMode: data.darkMode || false,
          emailAlerts: data.emailAlerts !== undefined ? data.emailAlerts : true
        });
      }
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
