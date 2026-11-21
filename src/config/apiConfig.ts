import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the appropriate base API URL depending on the running environment:
 * - Web: dynamically uses the current browser hostname (localhost or LAN IP)
 * - Physical Devices (iOS / Android scanning Expo Go): dynamically gets the host IP (e.g. 192.168.31.185)
 * - Android Emulator: 10.0.2.2 (maps to host machine's localhost)
 * - iOS Simulator / Local fallback: localhost (127.0.0.1)
 */
export function getDefaultApiBaseUrl(): string {
  // 1. Explicit production/staging environment variable (for deployed web or builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const PORT = 5001;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${PORT}`;
  }

  // Attempt to extract host IP from Metro bundler host URI
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:${PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}`;
  }

  return `http://localhost:${PORT}`;
}
