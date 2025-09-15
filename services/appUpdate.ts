import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export const checkForUpdates = async (): Promise<boolean> => {
  if (__DEV__) return false; // Skip in development

  try {
    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update Now',
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                Alert.alert(
                  'Update Downloaded',
                  'The update has been downloaded. Restart the app to apply changes.',
                  [
                    {
                      text: 'Restart Now',
                      onPress: () => Updates.reloadAsync(),
                    },
                  ]
                );
              } catch (error) {
                console.error('Error downloading update:', error);
                Alert.alert('Error', 'Failed to download update. Please try again later.');
              }
            },
          },
        ]
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return false;
  }
};

export const checkForUpdatesSilently = async (): Promise<boolean> => {
  if (__DEV__) return false;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Silent update check failed:', error);
    return false;
  }
};
