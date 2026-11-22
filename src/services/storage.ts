import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const AUTH_USER_KEY = 'chillbro_auth_user';
const AUTH_EXPIRY_KEY = 'chillbro_auth_expiry';
const DEFAULT_SESSION_DAYS = 30; // 30-day persistent session

export const StorageService = {
  /**
   * Save user session with expiration (default: 30 days)
   * Uses hardware-backed Keychain (iOS) & Keystore (Android), with localStorage on Web.
   */
  async saveUserSession(user: User, durationDays: number = DEFAULT_SESSION_DAYS): Promise<void> {
    try {
      const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
      const userJson = JSON.stringify(user);
      const expiryStr = expiresAt.toString();

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(AUTH_USER_KEY, userJson);
          window.localStorage.setItem(AUTH_EXPIRY_KEY, expiryStr);
        }
      } else {
        await SecureStore.setItemAsync(AUTH_USER_KEY, userJson);
        await SecureStore.setItemAsync(AUTH_EXPIRY_KEY, expiryStr);
      }
    } catch (error) {
      console.warn('[StorageService] Error saving session:', error);
    }
  },

  /**
   * Get active user session if not expired
   */
  async getUserSession(): Promise<User | null> {
    try {
      let userJson: string | null = null;
      let expiryStr: string | null = null;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          userJson = window.localStorage.getItem(AUTH_USER_KEY);
          expiryStr = window.localStorage.getItem(AUTH_EXPIRY_KEY);
        }
      } else {
        userJson = await SecureStore.getItemAsync(AUTH_USER_KEY);
        expiryStr = await SecureStore.getItemAsync(AUTH_EXPIRY_KEY);
      }

      if (!userJson) {
        return null;
      }

      // Check if session has expired
      if (expiryStr) {
        const expiresAt = parseInt(expiryStr, 10);
        if (Date.now() > expiresAt) {
          console.log('[StorageService] User session expired after 30 days. Clearing storage.');
          await this.clearUserSession();
          return null;
        }
      }

      const user: User = JSON.parse(userJson);
      return user;
    } catch (error) {
      console.warn('[StorageService] Error retrieving session:', error);
      return null;
    }
  },

  /**
   * Clear user session on logout
   */
  async clearUserSession(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(AUTH_USER_KEY);
          window.localStorage.removeItem(AUTH_EXPIRY_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(AUTH_USER_KEY);
        await SecureStore.deleteItemAsync(AUTH_EXPIRY_KEY);
      }
    } catch (error) {
      console.warn('[StorageService] Error clearing session:', error);
    }
  },
};
