import { Alert, Linking, Platform } from 'react-native';
import { getVersion, getBuildNumber } from 'react-native-device-info';
import Config from 'react-native-config';

const GITHUB_REPO = 'sona-solutions/moneybalance';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

type GitHubRelease = {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
};

export const checkForUpdates = async (silent = false): Promise<boolean> => {
  if (__DEV__) {
    !silent && Alert.alert('Development Mode', 'Update checking is disabled in development mode.');
    return false;
  }

  try {
    const response = await fetch(GITHUB_API, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch release info');

    const release: GitHubRelease = await response.json();
    const currentVersion = getVersion();
    const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if exists

    if (isNewerVersion(currentVersion, latestVersion)) {
      if (silent) return true;
      
      Alert.alert(
        'Update Available',
        `Version ${latestVersion} is available. Would you like to download it now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => downloadUpdate(release),
          },
        ]
      );
      return true;
    } else if (!silent) {
      Alert.alert('No Updates', 'You are running the latest version.');
    }
    return false;
  } catch (error) {
    console.error('Update check failed:', error);
    if (!silent) {
      Alert.alert('Update Check Failed', 'Could not check for updates. Please try again later.');
    }
    return false;
  }
};

const isNewerVersion = (current: string, latest: string): boolean => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  return false;
};

const downloadUpdate = (release: GitHubRelease) => {
  // On mobile, open the release page in browser
  // On web, try to find a platform-specific asset
  let downloadUrl = release.html_url;
  
  if (Platform.OS === 'web') {
    const platformAsset = release.assets.find(asset => 
      asset.name.includes(process.platform) || 
      (Platform.OS === 'android' && asset.name.includes('android')) ||
      (Platform.OS === 'ios' && asset.name.includes('ios'))
    );
    
    if (platformAsset) {
      downloadUrl = platformAsset.browser_download_url;
    }
  }
  
  Linking.openURL(downloadUrl).catch(err => {
    console.error('Failed to open download URL:', err);
    Alert.alert('Error', 'Could not open the download page. Please try again later.');
  });
};

// Background check that runs on app start
export const checkForUpdatesInBackground = async () => {
  if (__DEV__) return;
  
  try {
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Only check once per day
    if (lastCheck && (Date.now() - Number(lastCheck) < oneDay)) {
      return;
    }
    
    localStorage.setItem('lastUpdateCheck', String(Date.now()));
    await checkForUpdates(true); // Silent check
  } catch (error) {
    console.error('Background update check failed:', error);
  }
};
