import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkForUpdates, checkForUpdatesInBackground } from '@/services/githubUpdate';

type UpdateContextType = {
  isChecking: boolean;
  isUpdateAvailable: boolean;
  checkForUpdates: () => Promise<void>;
};

const UpdateContext = createContext<UpdateContextType>({
  isChecking: false,
  isUpdateAvailable: false,
  checkForUpdates: async () => {},
});

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const handleCheckForUpdates = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const hasUpdate = await checkForUpdates();
      setIsUpdateAvailable(hasUpdate);
    } finally {
      setIsChecking(false);
    }
  };

  // Check for updates when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdatesInBackground();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Initial background check
  useEffect(() => {
    checkForUpdatesInBackground();
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        isChecking,
        isUpdateAvailable,
        checkForUpdates: handleCheckForUpdates,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => useContext(UpdateContext);
