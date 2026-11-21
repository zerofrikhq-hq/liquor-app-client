import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const PRODUCTION_API_URL = 'https://chillbro-backend-nzel.onrender.com';

/**
 * Resolves the appropriate base API URL depending on the running environment:
 * 1. Explicit EXPO_PUBLIC_API_URL environment variable (if set during build)
 * 2. Hosted Web (Netlify / Vercel): automatically connects to Render cloud backend
 * 3. Local Web: connects to http://<hostname>:5001
 * 4. Physical Devices (Expo Go): connects to Metro host IP (e.g. 192.168.31.185:5001)
 * 5. Android Emulator: http://10.0.2.2:5001
 * 6. iOS Simulator / Default fallback: http://localhost:5001
 */
export function getDefaultApiBaseUrl(): string {
  // 1. Explicit environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const PORT = 5001;

  // 2. Web browser resolution
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    // Local development web (localhost or LAN IP)
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `http://${host}:${PORT}`;
    }
    // Deployed web (Netlify, Vercel, custom domain) -> Render backend
    return PRODUCTION_API_URL;
  }

  // 3. Physical mobile devices on Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:${PORT}`;
    }
  }

  // 4. Android Emulator
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}`;
  }

  // 5. Default local fallback
  return `http://localhost:${PORT}`;
}
