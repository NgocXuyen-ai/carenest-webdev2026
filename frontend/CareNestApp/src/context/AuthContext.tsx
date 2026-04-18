import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { mockCurrentUser } from '../data/mockUsers';

interface AuthContextValue {
  isLoggedIn: boolean;
  user: User | null;
  isOnboardingDone: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_AUTH = '@carenest_auth';
const STORAGE_KEY_ONBOARDING = '@carenest_onboarding_done';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [authValue, onboardingValue] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_AUTH),
        AsyncStorage.getItem(STORAGE_KEY_ONBOARDING),
      ]);
      if (authValue) {
        setIsLoggedIn(true);
        setUser(mockCurrentUser);
      }
      if (onboardingValue) {
        setIsOnboardingDone(true);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(_email: string, _password: string) {
    // Mock: accept any credentials
    await AsyncStorage.setItem(STORAGE_KEY_AUTH, 'true');
    setUser(mockCurrentUser);
    setIsLoggedIn(true);
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH);
    setUser(null);
    setIsLoggedIn(false);
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
    setIsOnboardingDone(true);
  }

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isOnboardingDone, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
